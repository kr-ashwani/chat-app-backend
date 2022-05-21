const jwt = require('jsonwebtoken');
const User = require('../../models/user');

module.exports = async function (req, res) {
  const { _auth_token } = req.cookies;
  res.clearCookie('_auth_token', {
    domain: '.agile-dusk-57703.herokuapp.com',
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
  console.log(_auth_token);
  res.sendStatus(200);
  try {
    // if (!_auth_token) return res.sendStatus(401);

    let decoded;
    jwt.verify(
      _auth_token,
      process.env.REFRESH_TOKEN_SECRET_KEY,
      (err, response) => {
        if (err) return res.sendStatus(404);
        decoded = response;
      }
    );

    const user = await User.findOne({ email: decoded.email }).exec();

    // console.log(user);
    // if (!user) return res.sendStatus(403);

    const remaingRefreshTokenList = user.refreshTokenList.filter(
      (token) => !token.refreshToken.includes(_auth_token)
    );
    user.refreshTokenList = remaingRefreshTokenList;
    await user.save();

    // res.sendStatus(200);
  } catch (err) {
    res.sendStatus(404);
  }
};
