const express = require('express');

const router = express.Router();
const loginController = require('../../controllers/auth/loginController');
const logoutController = require('../../controllers/auth/logoutController');
const signupController = require('../../controllers/auth/signupController');

router
  .route('/signup')
  .get(signupController.signup_get)
  .post(signupController.signup_post);

router
  .route('/login')
  .get(loginController.login_get)
  .post(loginController.login_post);

router.get('/logout', logoutController);

module.exports = router;
