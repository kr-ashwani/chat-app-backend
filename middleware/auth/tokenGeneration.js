const jwt = require('jsonwebtoken');
const {
  createAccessToken,
  createRefreshToken,
} = require('../../controllers/utils/newJwtToken');
const User = require('../../models/user');
const handleErrors = require('../../controllers/utils/handleErrors');
const getUserInfo = require('../../controllers/utils/getUserInfo');

async function tokenGeneration(req, res, next) {
  const { _auth_token } = req.cookies;
  const _access_token = req.headers.authorization?.split(' ').pop();
  try {
    // if user has refresh token
    if (_access_token) {
      try {
        const decoded = jwt.verify(
          _access_token,
          process.env.ACCESS_TOKEN_SECRET_KEY
        );

        const user = await User.findOne({ email: decoded.email }).exec();

        if (!user) {
          res.clearCookie('_auth_token');
          return res.status(403).json('user is not registered.');
        }

        req.user = getUserInfo(user);
        req.refreshToken = _auth_token;
        req.accessToken = _access_token;
        return next();
      } catch (err) {
        console.log(err.message);
      }
    }

    // if you dont have refresh token as cookie
    if (!_auth_token) {
      req.accessToken = null;
      req.user = null;
      return next();
    }

    let userPayload = null;

    try {
      const decoded = jwt.verify(
        _auth_token,
        process.env.REFRESH_TOKEN_SECRET_KEY
      );
      userPayload = decoded;
    } catch (err) {
      res.clearCookie('_auth_token');
      return res.status(403).json('invalid refresh token.');
    }

    const user = await User.findOne({ email: userPayload.email }).exec();

    user.lastLoginAt = new Date().getTime();
    await user.save();

    if (!user) {
      res.clearCookie('_auth_token');
      return res.status(403).json('user is not registered.');
    }

    req.user = getUserInfo(user);

    // if user has refresh token but no access token

    const accessToken = createAccessToken(userPayload);
    const refreshToken = createRefreshToken(userPayload);
    res.cookie('_auth_token', refreshToken, {
      httpOnly: true,
      // secure: true,
      maxAge: process.env.REFRESH_TOKEN_EXP_TIME,
      sameSite: 'lax',
    });

    req.user = getUserInfo(user);
    req.refreshToken = refreshToken;
    req.accessToken = accessToken;

    return next();
  } catch (err) {
    const message = handleErrors(err);
    res.status(403).json({ message });
  }
}

module.exports = tokenGeneration;
