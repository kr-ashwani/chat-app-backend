const jwt = require('jsonwebtoken');
const {
  createAccessToken,
  createRefreshToken,
} = require('../utils/newJwtToken');
const User = require('../../models/user');
const getValidRefreshTokenList = require('../utils/getValidRefreshTokenList');
const handleErrors = require('../utils/handleErrors');

async function refreshController(req, res) {
  const { _auth_token } = req.cookies;
  try {
    if (!_auth_token) return res.status(200).json({ message: 'unauthorized' });

    const newTokenTime = Number(req.headers['x-tokenreqtime']);
    const decoded = jwt.verify(
      _auth_token,
      process.env.REFRESH_TOKEN_SECRET_KEY
    );
    const { iat, exp, ...userPayload } = decoded;

    const user = await User.findOne({ email: userPayload.email }).exec();
    if (!user) return res.sendStatus(403);

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

    let requestedUserRefreshToken = nonExpiredRefreshToken.filter(
      (token) => token.refreshToken === _auth_token
    );
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
        (token) => token.refreshToken !== _auth_token
      );
      const refreshToken = createRefreshToken(userPayload);

      user.refreshTokenList = [
        ...remaingRefreshTokenList,
        { refreshToken, tokenStoringTime: Date.now() },
      ];

      await user.save();

      res.cookie('_auth_token', refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 1000,
        sameSite: 'lax',
      });
      console.log('new refresh token generated');
    }
    res.status(200).json({ accessToken });
  } catch (err) {
    const message = handleErrors(err);
    res.status(403).json({ message });
  }
}

module.exports = refreshController;
