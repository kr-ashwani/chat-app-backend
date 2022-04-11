const { default: axios } = require('axios');
const queryString = require('query-string');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const {
  createAccessToken,
  createRefreshToken,
} = require('../utils/newJwtToken');
const User = require('../../models/user');
const getValidRefreshTokenList = require('../utils/getValidRefreshTokenList');
const handleErrors = require('../utils/handleErrors');

async function getGoogleToken(code, redirectPath) {
  const url = 'https://oauth2.googleapis.com/token';
  const values = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: `${process.env.GOOGLE_SERVER_REDIRECT}${redirectPath}`,
    grant_type: 'authorization_code',
  };
  try {
    const res = await axios.post(url, queryString.stringify(values), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return res.data;
  } catch (err) {
    console.log('error', err.message);
    throw new Error(err.message);
  }
}

async function googleSignupController(req, res) {
  if (!req.query.code)
    return res.redirect(
      `${process.env.CLIENT_REDIRECT_URL}?error=google server didn't responded.Try agian`
    );

  const { code } = req.query;
  try {
    const { id_token, access_token } = await getGoogleToken(code, '/signup');
    const { payload: userPayload } = jwt.decode(id_token, { complete: true });

    if (!userPayload.email)
      return res.redirect(
        `${process.env.CLIENT_REDIRECT_URL}?error=No email registered in google account.`
      );

    const password = await bcrypt.hash(
      crypto.randomBytes(10).toString('hex'),
      10
    );
    const address = 'NA';
    const collegeName = 'NA';
    const emailVerified = userPayload.email_verified;
    const payloadData = {
      firstName: userPayload.given_name,
      lastName: userPayload.family_name,
      email: userPayload.email,
      authProvider: 'google',
    };
    const accessToken = createAccessToken(payloadData);
    const refreshToken = createRefreshToken(payloadData);
    const photoUrl = `${userPayload.picture.split('=s')[0]}=s400-c`;
    await User.create({
      firstName: userPayload.given_name,
      lastName: userPayload.family_name,
      email: userPayload.email,
      collegeName,
      address,
      password,
      authProvider: ['google'],
      refreshTokenList: [{ refreshToken, tokenStoringTime: Date.now() }],
      photoUrl,
      emailVerified,
      providerAccessToken: access_token,
    });

    res.cookie('_auth_token', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 1000,
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

async function googleLoginController(req, res) {
  if (!req.query.code)
    return res.redirect(
      `${process.env.CLIENT_REDIRECT_URL}?error=google server didn't responded.Try agian`
    );
  const { code } = req.query;
  try {
    const { id_token, access_token } = await getGoogleToken(code, '/login');
    const { payload: userPayload } = jwt.decode(id_token, { complete: true });

    if (!userPayload.email)
      return res.redirect(
        `${process.env.CLIENT_REDIRECT_URL}?error=No email registered in google account`
      );

    const user = await User.findOne({ email: userPayload.email }).exec();
    if (!user)
      return res.redirect(
        `${process.env.CLIENT_REDIRECT_URL}?error=You are not registered.please signup`
      );
    const payloadData = {
      firstName: userPayload.given_name,
      lastName: userPayload.family_name,
      email: userPayload.email,
      authProvider: 'google',
    };
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

    if (!user.authProvider.includes('google'))
      user.authProvider = [...user.authProvider, 'google'];

    if (userPayload.email_verified)
      user.emailVerified = userPayload.email_verified;

    await user.save();

    res.cookie('_auth_token', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 1000,
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

module.exports = { googleSignupController, googleLoginController };
