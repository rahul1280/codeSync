const express = require('express');
const executionController = require('../controllers/executionController');
const authenticate = require('../middlewares/authenticate');
const validateRequest = require('../middlewares/validateRequest');
const { executionLimiter } = require('../middlewares/rateLimiter');
const { executeCodeValidator } = require('../validators/executionValidators');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  executionLimiter,
  executeCodeValidator,
  validateRequest,
  executionController.executeCode
);

router.get(
  '/:executionId',
  executionController.getExecution
);

module.exports = router;
