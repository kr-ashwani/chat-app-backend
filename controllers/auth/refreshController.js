const jwt = require("jsonwebtoken");
const { createAccessToken, createRefreshToken } = require("../newJwtToken.js");
const User = require("../../models/user.js");

async function refreshController(req, res) {
  const { _auth_token } = req.cookies;
  try {
    if (!_auth_token) return res.sendStatus(401);

    const newTokenTime = Number(req.headers["x-tokenreqtime"]);
    const user = await User.findOne({ refreshToken: _auth_token }).exec();
    // console.log(user);
    if (!user) return res.sendStatus(403);

    let decoded = jwt.verify(_auth_token, process.env.REFRESH_TOKEN_SECRET_KEY);
    const { iat, exp, ...payloadData } = decoded;

    const accessToken = createAccessToken(payloadData);

    if ((newTokenTime - user.tokenStoringTime) / 1000 > 30) {
      const remaingRefreshToken = user.refreshToken.filter(
        (token) => token !== _auth_token
      );
      const refreshToken = createRefreshToken(payloadData);

      user.tokenStoringTime = Date.now();
      user.refreshToken = [...remaingRefreshToken, refreshToken];
      await user.save();
      res.cookie("_auth_token", refreshToken, {
        httpOnly: true,
        // secure: true,
        maxAge: 60 * 1000,
        // sameSite: "lax",
      });
      console.log("new refresh token generated");
    }
    res.status(200).json({ accessToken });
  } catch (err) {
    console.log(err.message);
    res.sendStatus(403);
  }
}

module.exports = refreshController;
