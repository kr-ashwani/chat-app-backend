const { default: axios } = require('axios');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const {
  createAccessToken,
  createRefreshToken,
} = require('../utils/newJwtToken');
const User = require('../../models/user');
const handleErrors = require('../utils/handleErrors');

async function getFbAccessToken(code, redirectPath) {
  try {
    const tokenUrl = `https://graph.facebook.com/v13.0/oauth/access_token?client_id=${process.env.FB_APP_ID}&redirect_uri=${process.env.FB_REDIRECT_URI}${redirectPath}&client_secret=${process.env.FB_APP_SECRET}&code=${code}`;
    const response = await axios.get(tokenUrl);
    return response.data.access_token;
  } catch (err) {
    throw new Error(err);
  }
}
async function getFbUserInfo(access_token) {
  try {
    const userInfo = await axios.get(
      `https://graph.facebook.com/me?fields=["email","first_name","last_name","picture.type(large)"]&access_token=${access_token}`
    );
    return userInfo.data;
  } catch (err) {
    throw new Error(err);
  }
}

async function facebookSignupController(req, res) {
  if (!req.query.code)
    return res.redirect(
      `${process.env.CLIENT_REDIRECT_URL}?error=facebook server didn't respond.Try agian`
    );
  try {
    const access_token = await getFbAccessToken(req.query.code, '/signup');
    const userInfo = await getFbUserInfo(access_token);

    if (!userInfo.email)
      return res.redirect(
        `${process.env.CLIENT_REDIRECT_URL}?error=Your google account doesnot have a registered email.`
      );

    const password = await bcrypt.hash(
      crypto.randomBytes(10).toString('hex'),
      10
    );
    const emailVerified = 'true';
    const payloadData = {
      firstName: userInfo.first_name,
      lastName: userInfo.last_name,
      email: userInfo.email,
      authProvider: 'facebook',
    };
    const accessToken = createAccessToken(payloadData);
    const refreshToken = createRefreshToken(payloadData);
    const photoUrl = userInfo.picture.data.url;
    await User.create({
      firstName: userInfo.first_name,
      lastName: userInfo.last_name,
      email: userInfo.email,
      password,
      authProvider: ['facebook'],
      photoUrl,
      emailVerified,
      providerAccessToken: access_token,
    });

    res.cookie('_auth_token', refreshToken, {
      httpOnly: true,
      // secure: true,
      maxAge: process.env.REFRESH_TOKEN_EXP_TIME,
      sameSite: 'lax',
    });

    return res.redirect(
      `${process.env.CLIENT_REDIRECT_URL}?accessToken=${accessToken}`
    );
  } catch (err) {
    const message = handleErrors(err);
    return res.redirect(`${process.env.CLIENT_REDIRECT_URL}?error=${message}`);
  }
}

async function facebookLoginController(req, res) {
  if (!req.query.code)
    return res.redirect(
      `${process.env.CLIENT_REDIRECT_URL}?error=facebook server didn't respond.Try agian`
    );
  try {
    const access_token = await getFbAccessToken(req.query.code, '/login');
    const userInfo = await getFbUserInfo(access_token);

    if (!userInfo.email)
      return res.redirect(
        `${process.env.CLIENT_REDIRECT_URL}?error=Your facebook account doesnot have a registered email.`
      );

    const user = await User.findOne({ email: userInfo.email }).exec();
    if (!user)
      return res.redirect(
        `${process.env.CLIENT_REDIRECT_URL}?error=you are not registered.please signup`
      );
    const payloadData = {
      firstName: userInfo.first_name,
      lastName: userInfo.last_name,
      email: userInfo.email,
      authProvider: 'facebook',
    };
    const accessToken = createAccessToken(payloadData);
    const refreshToken = createRefreshToken(payloadData);

    user.providerAccessToken = access_token;
    user.lastLoginAt = Date.now();

    if (!user.authProvider.includes('facebook'))
      user.authProvider = [...user.authProvider, 'facebook'];

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

module.exports = { facebookSignupController, facebookLoginController };
