const { default: axios } = require("axios");
const queryString = require("query-string");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { createAccessToken, createRefreshToken } = require("../newJwtToken.js");
const User = require("../../models/user");

async function getGoogleToken(code) {
  const url = "https://oauth2.googleapis.com/token";
  const values = {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_SERVER_REDIRECT,
    grant_type: "authorization_code",
  };
  try {
    let res = await axios.post(url, queryString.stringify(values), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return res.data;
  } catch (err) {
    // console.log(err);
    throw new Error(err.message);
  }
}

async function googleSignupController(req, res) {
  const code = req.query.code;
  try {
    const { id_token, access_token } = await getGoogleToken(code);
    const { payload: userPayload } = jwt.decode(id_token, { complete: true });
    const password = await bcrypt.hash(
      crypto.randomBytes(10).toString("hex"),
      10
    );
    const address = "NA";
    const collegeName = "NA";
    const emailVerified = userPayload.email_verified;
    const payloadData = {
      firstName: userPayload.given_name,
      lastName: userPayload.family_name,
      email: userPayload.email,
      authProvider: "google",
    };
    const accessToken = createAccessToken(payloadData);
    const refreshToken = createRefreshToken(payloadData);
    const photoUrl = userPayload.picture.split("=s")[0] + "=s400-c";
    const data = await User.create({
      firstName: userPayload.given_name,
      lastName: userPayload.family_name,
      email: userPayload.email,
      collegeName,
      address,
      password,
      authProvider: ["google"],
      refreshToken: [refreshToken],
      photoUrl,
      emailVerified,
      providerAccessToken: access_token,
      tokenStoringTime: Date.now(),
    });

    res.cookie("_auth_token", refreshToken, {
      httpOnly: true,
      // secure: true,
      maxAge: 60 * 1000,
      // sameSite: "lax",
    });

    res.redirect(
      `${process.env.CLIENT_REDIRECT_URL}?accessToken=${accessToken}`
    );
  } catch (err) {
    console.log(err.message);
    res.redirect(`${process.env.CLIENT_REDIRECT_URL}?error=${err.message}`);
  }
}

module.exports = { googleSignupController };
