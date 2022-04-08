const express = require("express");
const {
  facebookSignupController,
  facebookLoginController,
} = require("../../controllers/auth/facebookAuthController");
const {
  githubSignupController,
} = require("../../controllers/auth/githubAuthController");
const {
  googleSignupController,
  googleLoginController,
} = require("../../controllers/auth/googleAuthController");
const refreshController = require("../../controllers/auth/refreshController");
const {
  userinfoController,
} = require("../../controllers/auth/userinfoController");
const router = express.Router();

router.get("/google/signup", googleSignupController);
router.get("/google/login", googleLoginController);
router.get("/facebook/signup", facebookSignupController);
router.get("/facebook/login", facebookLoginController);
router.get("/github/signup", githubSignupController);
// router.get("/github/login", githubLoginController);
router.get("/userinfo", userinfoController);
router.get("/refresh", refreshController);

module.exports = router;
