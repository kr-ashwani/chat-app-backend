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
const router = express.Router();

router.get("/google/signup", googleSignupController);
router.get("/facebook/signup", facebookSignupController);
router.get("/github/signup", githubSignupController);

module.exports = router;
