const { body, param } = require('express-validator');
const { SUPPORTED_LANGUAGES } = require('../utils/constants');

const filenameRegex = /^[a-zA-Z0-9_\-\.]+$/;

const createFileValidator = [
  body('filename')
    .trim()
    .notEmpty().withMessage('Filename is required')
    .isLength({ min: 1, max: 100 }).withMessage('Filename must be between 1 and 100 characters')
    .matches(filenameRegex).withMessage('Filename contains invalid characters. Use alphanumeric, dash, underscore, and dot only.'),
  body('language')
    .optional()
    .isIn(SUPPORTED_LANGUAGES).withMessage(`Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`),
  body('content')
    .optional()
    .isString().withMessage('Content must be a string')
];

const updateFileValidator = [
  body('filename')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Filename must be between 1 and 100 characters')
    .matches(filenameRegex).withMessage('Filename contains invalid characters.'),
  body('language')
    .optional()
    .isIn(SUPPORTED_LANGUAGES).withMessage(`Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`)
];

const saveFileValidator = [
  body('content')
    .isString().withMessage('File content must be a string'),
  body('message')
    .optional()
    .isString().withMessage('Message must be a string')
    .isLength({ max: 200 }).withMessage('Message cannot exceed 200 characters')
];

const restoreVersionValidator = [
  param('versionNumber')
    .isInt({ min: 1 }).withMessage('Version number must be a positive integer')
];

module.exports = {
  createFileValidator,
  updateFileValidator,
  saveFileValidator,
  restoreVersionValidator
};
