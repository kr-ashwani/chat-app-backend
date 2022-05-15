const jwt = require('jsonwebtoken');

module.exports = (refreshTokenList) => {
  const nonExpiredRefreshToken = [];
  refreshTokenList.forEach((token) => {
    const tokenToCheck =
      token.refreshToken.length === 2
        ? token.refreshToken[1]
        : token.refreshToken[0];
    jwt.verify(tokenToCheck, process.env.REFRESH_TOKEN_SECRET_KEY, (err) => {
      if (err) return;
      nonExpiredRefreshToken.push(token);
    });
  });
  return nonExpiredRefreshToken;
};
