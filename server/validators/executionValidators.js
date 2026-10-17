const { body } = require('express-validator');
const { EXECUTABLE_LANGUAGES, SUPPORTED_LANGUAGES } = require('../utils/constants');

const executeCodeValidator = [
  body('language')
    .notEmpty().withMessage('Language is required')
    .isIn(EXECUTABLE_LANGUAGES).withMessage(`Language must be one of: ${EXECUTABLE_LANGUAGES.join(', ')}`),
  body('code')
    .notEmpty().withMessage('Code is required')
    .isString().withMessage('Code must be a string')
    .custom((val) => {
      // 50KB limit in bytes
      const bytes = Buffer.byteLength(val, 'utf8');
      if (bytes > 50 * 1024) {
        throw new Error('Code exceeds maximum allowed size of 50KB');
      }
      return true;
    }),
  body('roomId')
    .optional()
    .isMongoId().withMessage('Invalid roomId format'),
  body('fileId')
    .optional()
    .isMongoId().withMessage('Invalid fileId format')
];

const aiPromptValidator = [
  body('code')
    .notEmpty().withMessage('Code is required')
    .isString().withMessage('Code must be a string')
    .custom((val) => {
      const bytes = Buffer.byteLength(val, 'utf8');
      if (bytes > 50 * 1024) {
        throw new Error('Code exceeds maximum allowed size of 50KB');
      }
      return true;
    }),
  body('language')
    .optional()
    .isIn(SUPPORTED_LANGUAGES).withMessage(`Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`)
];

module.exports = {
  executeCodeValidator,
  aiPromptValidator
};
