const jwt = require('jsonwebtoken');

module.exports = (refreshTokenList) => {
  const nonExpiredRefreshToken = [];
  refreshTokenList.forEach((token) => {
    jwt.verify(
      token.refreshToken,
      process.env.REFRESH_TOKEN_SECRET_KEY,
      (err) => {
        if (err) return;
        nonExpiredRefreshToken.push(token);
      }
    );
  });
  return nonExpiredRefreshToken;
};
