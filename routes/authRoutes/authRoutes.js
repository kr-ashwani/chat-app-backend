const express = require('express');

const router = express.Router();
const loginController = require('../../controllers/auth/loginController');
const logoutController = require('../../controllers/auth/logoutController');
const signupController = require('../../controllers/auth/signupController');

router.route('/signup').post(signupController.signup_post);

router.route('/login').post(loginController.login_post);

router.get('/logout', logoutController);

module.exports = router;
