const jwt = require('jsonwebtoken');
const {
  createAccessToken,
  createRefreshToken,
} = require('../../controllers/utils/newJwtToken');
const User = require('../../models/user');
const getValidRefreshTokenList = require('../../controllers/utils/getValidRefreshTokenList');
const handleErrors = require('../../controllers/utils/handleErrors');
const getUserInfo = require('../../controllers/utils/getUserInfo');

async function tokenGeneration(req, res, next) {
  const { _auth_token } = req.cookies;
  const _access_token = req.headers.authorization?.split(' ').pop();
  // console.log('access token : ', _access_token);
  try {
    if (_access_token) {
      const decoded = jwt.verify(
        _access_token,
        process.env.ACCESS_TOKEN_SECRET_KEY
      );
      const { iat, exp, ...userPayload } = decoded;

      const user = await User.findOne({ email: userPayload.email }).exec();

      req.accessToken = _access_token;
      req.user = user;
      return next();
    }

    if (!_auth_token) {
      req.accessToken = null;
      req.user = null;
      return next();
    }

    req.refreshToken = _auth_token;
    const newTokenTime = Number(req.headers['x-tokenreqtime']);
    const decoded = jwt.verify(
      _auth_token,
      process.env.REFRESH_TOKEN_SECRET_KEY
    );
    const { iat, exp, ...userPayload } = decoded;

    const user = await User.findOne({ email: userPayload.email }).exec();
    //  have refresh token but no user found
    if (!user) {
      res.clearCookie('_auth_token');
      return res.sendStatus(403);
    }

    // console.log("culprit", requestedUserRefreshToken);
    // React strict mode problem
    // react in strict mode renders twice
    // so in every page refresh components will be rendered twice
    //! so two request will be sent simultaneously having same refresh token
    // first request is processed and new refresh token is generated(if all criteria fulfills)
    // this newly generated refresh token is sent to server and is saved in database
    // new refresh token generated will be displayed in console
    //! but remember there is one more request with old refresh token in the queque
    //  ? since our database is updated with new refresh token
    //! so requestedUserRefreshToken will have undefined
    // because there will be no user with that old token
    //  so use optional chaining to get rid from this

    const nonExpiredRefreshToken = getValidRefreshTokenList(
      user.refreshTokenList
    );

    let requestedUserRefreshToken = nonExpiredRefreshToken.filter((token) =>
      token.refreshToken.includes(_auth_token)
    );

    //  only in development strict mode react renders twice
    //  don't do anthing here react renders twice so you will get requestedUserRefreshToken.length=0
    //  hacked user

    if (!requestedUserRefreshToken.length) {
      console.log('user is hacked');
      user.refreshTokenList = [];

      await user.save();

      res.clearCookie('_auth_token');
      return res.sendStatus(403);
    }

    [requestedUserRefreshToken] = requestedUserRefreshToken;
    if (!requestedUserRefreshToken?.refreshToken) return res.sendStatus(403);

    const accessToken = createAccessToken(userPayload);

    if (
      (newTokenTime - requestedUserRefreshToken.tokenStoringTime) / 1000 <=
      30
    ) {
      user.refreshTokenList = nonExpiredRefreshToken;
      await user.save();
    }

    if (
      (newTokenTime - requestedUserRefreshToken.tokenStoringTime) / 1000 >
      30
    ) {
      //  removing expired refreshtoken

      const remaingRefreshTokenList = nonExpiredRefreshToken.filter(
        (token) => !token.refreshToken.includes(_auth_token)
      );
      const refreshToken = createRefreshToken(userPayload);

      const newRefresh = requestedUserRefreshToken;
      if (newRefresh.refreshToken.length === 2) {
        newRefresh.refreshToken.shift();
        newRefresh.refreshToken.push(refreshToken);
        newRefresh.tokenStoringTime = Date.now();
      } else if (newRefresh.refreshToken.length === 1) {
        newRefresh.refreshToken.push(refreshToken);
        newRefresh.tokenStoringTime = Date.now();
      }

      user.refreshTokenList = [...remaingRefreshTokenList, newRefresh];

      await user.save();

      res.cookie('_auth_token', refreshToken, {
        httpOnly: true,
        // secure: true,
        maxAge: process.env.REFRESH_TOKEN_EXP_TIME,
        sameSite: 'lax',
      });

      console.log('new refresh token generated');
    }

    req.accessToken = accessToken;
    req.user = getUserInfo(user);

    return next();
  } catch (err) {
    const message = handleErrors(err);
    res.status(403).json({ message });
  }
}

module.exports = tokenGeneration;
