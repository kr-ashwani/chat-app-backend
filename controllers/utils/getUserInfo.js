const handleErrors = require('./handleErrors');

module.exports = async (user) => {
  try {
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
    } = user;

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
