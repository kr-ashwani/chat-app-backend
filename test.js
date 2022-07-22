const jwt = require('jsonwebtoken');
const { createAccessToken } = require('./controllers/utils/newJwtToken');

module.exports = () => {
  const accessToken = createAccessToken({ name: 'ashwani' });

  setTimeout(() => {
    try {
      const decoded = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET_KEY
      );
      console.log(decoded);
      console.log('hello');
    } catch (err) {
      console.log(err);
    }
    console.log('hello buffaloow');
    console.log('kaise ho bha');
  }, 5000);
};
