const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const handleErrors = require('./handleErrors');

module.exports = async (accessToken) => {
  try {
    const userPayload = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET_KEY
    );
    const {
      firstName,
      lastName,
      address,
      email,
      photoUrl,
      collegeName,
      emailVerified,
      userName,
      createdAt,
      lastLoginAt,
      authProvider,
    } = await User.findOne({ email: userPayload.email }).exec();

    return {
      firstName,
      lastName,
      address,
      email,
      photoUrl,
      collegeName,
      emailVerified,
      userName,
      createdAt,
      lastLoginAt,
      authProvider,
    };
  } catch (err) {
    const message = handleErrors(err);
    throw new Error(message);
  }
};
