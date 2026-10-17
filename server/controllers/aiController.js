const aiService = require('../services/aiService');
const { success } = require('../utils/responseHelper');
const catchAsync = require('../utils/catchAsync');

const explainCode = catchAsync(async (req, res) => {
  const { code, language } = req.body;
  const explanation = await aiService.explainCode(code, language || 'javascript');
  return success(res, { explanation }, 200);
});

const suggestTests = catchAsync(async (req, res) => {
  const { code, language } = req.body;
  const suggestions = await aiService.suggestTests(code, language || 'javascript');
  return success(res, { suggestions }, 200);
});

const getAiStatus = catchAsync(async (req, res) => {
  const status = await aiService.checkAiAvailability();
  return success(res, { status }, 200);
});

module.exports = {
  explainCode,
  suggestTests,
  getAiStatus
};
