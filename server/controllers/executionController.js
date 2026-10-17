const executionService = require('../services/executionService');
const { success } = require('../utils/responseHelper');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const executeCode = catchAsync(async (req, res) => {
  const { language, code, roomId, fileId } = req.body;

  const execution = await executionService.executeCode({
    userId: req.user.id,
    roomId,
    fileId,
    language,
    code
  });

  return success(
    res,
    {
      execution,
      output: execution.output || '',
      stdout: execution.output || '',
      error: execution.error || '',
      stderr: execution.error || '',
      status: execution.status,
      executionTime: execution.executionTime
    },
    200,
    'Code executed'
  );
});

const getExecution = catchAsync(async (req, res) => {
  const execution = await executionService.getExecutionById(req.params.executionId);
  if (!execution) {
    throw new AppError('Execution not found', 404, 'EXECUTION_NOT_FOUND');
  }

  return success(res, { execution }, 200);
});

module.exports = {
  executeCode,
  getExecution
};
