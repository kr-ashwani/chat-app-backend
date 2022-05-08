const { default: axios } = require('axios');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const {
  createAccessToken,
  createRefreshToken,
} = require('../utils/newJwtToken');
const User = require('../../models/user');
const getValidRefreshTokenList = require('../utils/getValidRefreshTokenList');
const handleErrors = require('../utils/handleErrors');

async function getGithubAccessToken(code) {
  try {
    const tokenUrl = await axios.get(
      `https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
    const { access_token } = tokenUrl.data;
    return access_token;
  } catch (err) {
    throw new Error(err);
  }
}
async function getGithubUserDetail(access_token) {
  try {
    const userDetail = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${access_token}`,
      },
    });

    const userEmail = await axios.get('https://api.github.com/user/emails', {
      headers: {
        Authorization: `token ${access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const email = userEmail.data.filter((e) => e.primary);
    return { ...userDetail, ...email[0] };
  } catch (err) {
    throw new Error(err);
  }
}

async function githubSignupController(req, res) {
  if (!req.query.code)
    return res.redirect(
      `${process.env.CLIENT_REDIRECT_URL}?error=github server didn't respond.Try agian`
    );
  try {
    const access_token = await getGithubAccessToken(req.query.code);
    const userDetail = await getGithubUserDetail(access_token);

    if (!userDetail?.data?.id)
      return res.redirect(
        `${process.env.CLIENT_REDIRECT_URL}?error=no user details returned from github server.`
      );

    if (!userDetail.email)
      return res.redirect(
        `${process.env.CLIENT_REDIRECT_URL}?error="You don't have registered email to your github account."`
      );

    const userInfoFromGithub = userDetail.data;

    const lastName =
      userInfoFromGithub.name.split(' ').length > 1
        ? userInfoFromGithub.name.split(' ').pop()
        : 'NA';
    const firstName = userInfoFromGithub.name.split(' ')[0];

    const payloadData = {
      firstName,
      lastName,
      email: userDetail.email,
      userName: userInfoFromGithub.login,
      twitter_username: userInfoFromGithub?.twitter_username
        ? userInfoFromGithub.twitter_username
        : 'NA',
      authProvider: 'github',
    };
    const password = await bcrypt.hash(
      crypto.randomBytes(10).toString('hex'),
      10
    );
    const accessToken = createAccessToken(payloadData);
    const refreshToken = createRefreshToken(payloadData);
    const photoUrl = userInfoFromGithub.avatar_url;
    await User.create({
      firstName,
      lastName,
      email: userDetail.email,
      password,
      authProvider: ['github'],
      refreshTokenList: [{ refreshToken, tokenStoringTime: Date.now() }],
      photoUrl,
      userName: userInfoFromGithub.login,
      providerAccessToken: access_token,
      emailVerified: userDetail.verified,
    });

    res.cookie('_auth_token', refreshToken, {
      httpOnly: true,
      // secure: true,
      maxAge: process.env.REFRESH_TOKEN_EXP_TIME,
      sameSite: 'lax',
    });

    res.redirect(
      `${process.env.CLIENT_REDIRECT_URL}?accessToken=${accessToken}`
    );
  } catch (err) {
    const message = handleErrors(err);
    res.redirect(`${process.env.CLIENT_REDIRECT_URL}?error=${message}`);
  }
}

async function githubLoginController(req, res) {
  if (!req.query.code) return res.sendStatus(403);
  try {
    const access_token = await getGithubAccessToken(req.query.code);
    const userDetail = await getGithubUserDetail(access_token);

    if (!userDetail?.data?.id)
      return res.redirect(
        `${process.env.CLIENT_REDIRECT_URL}?error=No user details returned from github server.`
      );
    if (!userDetail.email)
      return res.redirect(
        `${process.env.CLIENT_REDIRECT_URL}?error=You don't have registered email to your github account.`
      );

    const userInfoFromGithub = userDetail.data;

    const lastName =
      userInfoFromGithub.name.split(' ').length > 1
        ? userInfoFromGithub.name.split(' ').pop()
        : 'NA';
    const firstName = userInfoFromGithub.name.split(' ')[0];

    const payloadData = {
      firstName,
      lastName,
      email: userDetail.email,
      userName: userInfoFromGithub.login,
      twitter_username: userInfoFromGithub?.twitter_username
        ? userInfoFromGithub.twitter_username
        : 'NA',
      authProvider: 'github',
    };

    const user = await User.findOne({ email: payloadData.email }).exec();
    if (!user)
      return res.redirect(
        `${process.env.CLIENT_REDIRECT_URL}?error=You are not registered.please signup`
      );

    const accessToken = createAccessToken(payloadData);
    const refreshToken = createRefreshToken(payloadData);

    const nonExpiredRefreshToken = getValidRefreshTokenList(
      user.refreshTokenList
    );

    user.refreshTokenList = [
      ...nonExpiredRefreshToken,
      { refreshToken, tokenStoringTime: Date.now() },
    ];

    user.providerAccessToken = access_token;
    user.lastLoginAt = Date.now();

    if (!user.authProvider.includes('github'))
      user.authProvider = [...user.authProvider, 'github'];

    if (userDetail.verified) user.emailVerified = userDetail.verified;

    await user.save();

    res.cookie('_auth_token', refreshToken, {
      httpOnly: true,
      // secure: true,
      maxAge: process.env.REFRESH_TOKEN_EXP_TIME,
      sameSite: 'lax',
    });

    res.redirect(
      `${process.env.CLIENT_REDIRECT_URL}?accessToken=${accessToken}`
    );
  } catch (err) {
    const message = handleErrors(err);
    res.redirect(`${process.env.CLIENT_REDIRECT_URL}?error=${message}`);
  }
}

module.exports = { githubSignupController, githubLoginController };
