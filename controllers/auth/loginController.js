const bcrypt = require('bcrypt');
const User = require('../../models/user');
const getValidRefreshTokenList = require('../utils/getValidRefreshTokenList');
const handleErrors = require('../utils/handleErrors');
const {
  createRefreshToken,
  createAccessToken,
} = require('../utils/newJwtToken');

function login_get(req, res) {
  res.render('login');
}

async function login_post(req, res) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).exec();
    if (!user) throw new Error('incorrect email');
    const passComp = await bcrypt.compare(password, user.password);
    if (!passComp) throw new Error('incorrect password');

    const payloadData = {
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      authProvider: 'basicAuth',
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
    user.lastLoginAt = Date.now();

    await user.save();

    res.cookie('_auth_token', refreshToken, {
      httpOnly: true,
      // secure: true,
      maxAge: process.env.REFRESH_TOKEN_EXP_TIME,
      sameSite: 'lax',
    });

    res.status(200).json({ accessToken });
  } catch (err) {
    const message = handleErrors(err);
    res.status(403).json({ message });
  }
}

module.exports = { login_get, login_post };
