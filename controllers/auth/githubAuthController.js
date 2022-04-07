const { default: axios } = require("axios");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { createAccessToken, createRefreshToken } = require("../newJwtToken.js");
const User = require("../../models/user");
const FormData = require("form-data");

async function getGithubAccessToken(code) {
  try {
    const tokenUrl = await axios.get(
      `https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    const access_token = tokenUrl.data.access_token;
    return access_token;
  } catch (err) {
    throw new Error(err);
  }
}
async function getGithubUserDetail(access_token) {
  try {
    const userDetail = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${access_token}`,
      },
    });

    const formData = new FormData();
    formData.append("visibility", "visibility");
    const userEmail = await axios.get("https://api.github.com/user/emails", {
      headers: {
        Authorization: `token ${access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const email = userEmail.data.filter((e) => e.primary);
    return { ...userDetail, ...email[0] };
  } catch (err) {
    throw new Error(err);
  }
}

async function githubSignupController(req, res) {
  try {
    const access_token = await getGithubAccessToken(req.query.code);
    const userDetail = await getGithubUserDetail(access_token);

    if (userDetail?.data?.id) {
      if (!userDetail.email)
        throw new Error(
          "Your don't have registered email to your github account."
        );

      const userInfoFromGithub = userDetail.data;
      const lastName =
        userInfoFromGithub.name.split(" ").length > 1
          ? userInfoFromGithub.name.split(" ").pop()
          : "NA";
      const firstName = userInfoFromGithub.name.split(" ")[0];
      const payloadData = {
        firstName,
        lastName,
        userName: userInfoFromGithub.login,
        twitter_username: Boolean(userInfoFromGithub?.twitter_username)
          ? userInfoFromGithub.twitter_username
          : "NA",
        authProvider: "github",
      };
      const password = await bcrypt.hash(
        crypto.randomBytes(10).toString("hex"),
        10
      );
      const address = "NA";
      const collegeName = "NA";
      const accessToken = createAccessToken(payloadData);
      const refreshToken = createRefreshToken(payloadData);
      const photoUrl = userInfoFromGithub.avatar_url;
      const data = await User.create({
        firstName,
        lastName,
        email: userDetail.email,
        collegeName,
        address,
        password,
        authProvider: ["github"],
        refreshToken: [refreshToken],
        photoUrl,
        userName: userInfoFromGithub.login,
        providerAccessToken: access_token,
        emailVerified: userDetail.verified,
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
    }
  } catch (err) {
    console.log(err.message);
    res.redirect(`${process.env.CLIENT_REDIRECT_URL}?error=${err.message}`);
  }
}

module.exports = { githubSignupController };
