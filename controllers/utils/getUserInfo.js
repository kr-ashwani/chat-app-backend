const handleErrors = require('./handleErrors');

function getUserInfo(user) {
  try {
    const {
      firstName,
      lastName,
      email,
      photoUrl,
      emailVerified,
      userName,
      createdAt,
      lastLoginAt,
      authProvider,
      _id,
    } = user;

    return {
      firstName,
      lastName,
      email,
      photoUrl,
      emailVerified,
      userName,
      createdAt,
      lastLoginAt,
      authProvider,
      _id,
    };
  } catch (err) {
    const message = handleErrors(err);
    throw new Error(message);
  }
}

module.exports = getUserInfo;
