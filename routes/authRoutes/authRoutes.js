const express = require("express");
const router = express.Router();
const loginController = require("../../controllers/auth/loginController");
const signupController = require("../../controllers/auth/signupController");

router
  .route("/signup")
  .get(signupController.signup_get)
  .post(signupController.signup_post);
router
  .route("/login")
  .get(loginController.login_get)
  .post(loginController.login_post);

module.exports = router;
