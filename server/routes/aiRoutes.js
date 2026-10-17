const express = require('express');
const aiController = require('../controllers/aiController');
const authenticate = require('../middlewares/authenticate');
const validateRequest = require('../middlewares/validateRequest');
const { aiPromptValidator } = require('../validators/executionValidators');

const router = express.Router();

router.use(authenticate);

router.get('/status', aiController.getAiStatus);

router.post(
  '/explain',
  aiPromptValidator,
  validateRequest,
  aiController.explainCode
);

router.post(
  '/suggest-tests',
  aiPromptValidator,
  validateRequest,
  aiController.suggestTests
);

module.exports = router;
