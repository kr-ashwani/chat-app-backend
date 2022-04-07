const { default: axios } = require("axios");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { createAccessToken, createRefreshToken } = require("../newJwtToken.js");
const User = require("../../models/user");

async function getFbAccessToken(code) {
  try {
    const tokenUrl = `https://graph.facebook.com/v13.0/oauth/access_token?client_id=${process.env.FB_APP_ID}&redirect_uri=${process.env.FB_REDIRECT_URI}&client_secret=${process.env.FB_APP_SECRET}&code=${code}`;
    const response = await axios.get(tokenUrl);
    return response.data.access_token;
  } catch (err) {
    throw new Error(err);
  }
}
async function getFbUserInfo(access_token) {
  try {
    const userInfo = await axios.get(
      `https://graph.facebook.com/me?fields=["email","first_name","last_name","picture.type(large)"]&access_token=${access_token}`
    );
    return userInfo.data;
  } catch (err) {
    throw new Error(err);
  }
}

async function facebookSignupController(req, res) {
  try {
    const access_token = await getFbAccessToken(req.query.code);
    const userInfo = await getFbUserInfo(access_token);

    const password = await bcrypt.hash(
      crypto.randomBytes(10).toString("hex"),
      10
    );
    const address = "NA";
    const collegeName = "NA";
    const emailVerified = "true";
    const payloadData = {
      firstName: userInfo.first_name,
      lastName: userInfo.last_name,
      email: userInfo.email,
      authProvider: "facebook",
    };
    const accessToken = createAccessToken(payloadData);
    const refreshToken = createRefreshToken(payloadData);
    const photoUrl = userInfo.picture.data.url;
    const data = await User.create({
      firstName: userInfo.first_name,
      lastName: userInfo.last_name,
      email: userInfo.email,
      collegeName,
      address,
      password,
      authProvider: ["facebook"],
      refreshToken: [refreshToken],
      photoUrl,
      emailVerified,
      providerAccessToken: access_token,
    });

    res.cookie("_auth_token", refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 1000,
      sameSite: "none",
    });

    res.redirect(
      `${process.env.CLIENT_REDIRECT_URL}?accessToken=${accessToken}`
    );
  } catch (err) {
    console.log(err.message);
    res.redirect(`${process.env.CLIENT_REDIRECT_URL}?error=${err.message}`);
  }
}

module.exports = { facebookSignupController };
