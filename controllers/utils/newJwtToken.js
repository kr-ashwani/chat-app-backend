const jwt = require('jsonwebtoken');

function createAccessToken(payloadData) {
  const { iat, exp, ...userPayload } = payloadData;
  const accessToken = jwt.sign(
    userPayload,
    process.env.ACCESS_TOKEN_SECRET_KEY,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXP_TIME,
    }
  );
  return accessToken;
}
function createRefreshToken(payloadData) {
  const { iat, exp, ...userPayload } = payloadData;
  const refreshToken = jwt.sign(
    userPayload,
    process.env.REFRESH_TOKEN_SECRET_KEY,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXP_TIME,
    }
  );
  return refreshToken;
}

module.exports = { createAccessToken, createRefreshToken };
