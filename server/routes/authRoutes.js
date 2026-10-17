const express = require('express');
const authController = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');
const validateRequest = require('../middlewares/validateRequest');
const { authLimiter } = require('../middlewares/rateLimiter');
const {
  registerValidator,
  loginValidator
} = require('../validators/authValidators');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  registerValidator,
  validateRequest,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  loginValidator,
  validateRequest,
  authController.login
);

router.post(
  '/logout',
  authenticate,
  authController.logout
);

router.get(
  '/me',
  authenticate,
  authController.getMe
);

module.exports = router;
