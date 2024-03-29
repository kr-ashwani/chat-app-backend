const jwt = require('jsonwebtoken');
const {
  createAccessToken,
  createRefreshToken,
} = require('../../controllers/utils/newJwtToken');
const User = require('../../models/user');
const handleErrors = require('../../controllers/utils/handleErrors');
const getUserInfo = require('../../controllers/utils/getUserInfo');

function logUserIP(userName, userIP) {
  console.log(`IP address of ${userName || 'Anonymous user'} is  ${userIP}`);
}

async function tokenGeneration(req, res, next) {
  const userIP =
    (req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||
    req.socket.remoteAddress;
  let userName = null;
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
          logUserIP(userName, userIP);
          res.clearCookie('_auth_token');
          return res.status(403).json('user is not registered.');
        }

        req.user = getUserInfo(user);

        userName = `${user.firstName} ${user.lastName}`;
        logUserIP(userName, userIP);

        req.refreshToken = _auth_token;
        req.accessToken = _access_token;
        return next();
      } catch (err) {
        console.log(err.message);
      }
    }

    // if you dont have refresh token as cookie
    if (!_auth_token) {
      logUserIP(userName, userIP);
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
      logUserIP(userName, userIP);
      res.clearCookie('_auth_token');
      return res.status(403).json('invalid refresh token.');
    }

    const user = await User.findOne({ email: userPayload.email }).exec();

    if (!user) {
      logUserIP(userName, userIP);
      res.clearCookie('_auth_token');
      return res.status(403).json('user is not registered.');
    }

    user.lastLoginAt = new Date().getTime();
    await user.save();

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

    userName = `${user.firstName} ${user.lastName}`;
    logUserIP(userName, userIP);

    return next();
  } catch (err) {
    logUserIP(userName, userIP);
    const message = handleErrors(err);
    res.status(403).json({ message });
  }
}

module.exports = tokenGeneration;
