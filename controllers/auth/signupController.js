const bcrypt = require('bcrypt');
const User = require('../../models/user');
const handleErrors = require('../utils/handleErrors');
const {
  createAccessToken,
  createRefreshToken,
} = require('../utils/newJwtToken');

function signup_get(req, res) {
  res.render('signup');
}

async function signup_post(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      authType = 'basicAuth',
      photoUrl,
    } = req.body;
    const payloadData = {
      email,
      firstName,
      lastName,
      authProvider: 'basicAuth',
    };
    const passHash = await bcrypt.hash(password, 10);

    const accessToken = createAccessToken(payloadData);
    const refreshToken = createRefreshToken(payloadData);
    await User.create({
      firstName,
      lastName,
      email,
      password: passHash,
      authProvider: [authType],
      refreshTokenList: [
        { refreshToken: [refreshToken], tokenStoringTime: Date.now() },
      ],
      photoUrl,
    });

    res.cookie('_auth_token', refreshToken, {
      httpOnly: true,
      // secure: true,
      maxAge: process.env.REFRESH_TOKEN_EXP_TIME,
      sameSite: 'lax',
    });

    //  convert mongodb query object to object data.toObject().j
    //  best way to extract few properties from object and send the remaining.
    // const currentUser = (({
    //   authProvider,
    //   refreshToken,
    //   password,
    //   __v,
    //   ...dataToSend
    // }) => dataToSend)(data.toObject());

    res.status(200).json({ accessToken });
  } catch (err) {
    const message = handleErrors(err);
    res.status(400).json({ message });
  }
}

module.exports = { signup_get, signup_post };
