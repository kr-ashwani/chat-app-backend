const jwt = require('jsonwebtoken');

function createAccessToken(payloadData) {
  const accessToken = jwt.sign(
    payloadData,
    process.env.ACCESS_TOKEN_SECRET_KEY,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXP_TIME,
    }
  );
  return accessToken;
}
function createRefreshToken(payloadData) {
  const refreshToken = jwt.sign(
    payloadData,
    process.env.REFRESH_TOKEN_SECRET_KEY,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXP_TIME,
    }
  );
  return refreshToken;
}

module.exports = { createAccessToken, createRefreshToken };
