const express = require("express");
const {
  facebookSignupController,
} = require("../../controllers/auth/facebookAuthController");
const {
  githubSignupController,
} = require("../../controllers/auth/githubAuthController");
const {
  googleSignupController,
} = require("../../controllers/auth/googleAuthController");
const refreshController = require("../../controllers/auth/refreshController");
const {
  userinfoController,
} = require("../../controllers/auth/userinfoController");
const router = express.Router();

router.get("/google/signup", googleSignupController);
router.get("/facebook/signup", facebookSignupController);
router.get("/github/signup", githubSignupController);
router.get("/userinfo", userinfoController);
router.get("/refresh", refreshController);

module.exports = router;
