const env = require('../config/env');
const AppError = require('../utils/AppError');

function errorHandler(err, req, res, next) {
  let error = err;

  // Convert Mongoose/JWT/syntax errors to AppError
  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || error.status || 500;
    let message = error.message || 'Internal Server Error';
    let code = 'INTERNAL_ERROR';
    let details = null;

    if (error.name === 'ValidationError') {
      message = 'Validation failed';
      code = 'VALIDATION_ERROR';
      details = Object.values(error.errors).map((e) => ({
        field: e.path,
        message: e.message
      }));
    } else if (error.code === 11000) {
      message = 'Duplicate field value entered';
      code = 'DUPLICATE_KEY';
      details = error.keyValue;
    } else if (error.name === 'CastError') {
      message = `Invalid ${error.path}: ${error.value}`;
      code = 'INVALID_ID';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token';
      code = 'INVALID_TOKEN';
    } else if (error.name === 'TokenExpiredError') {
      message = 'Token expired';
      code = 'TOKEN_EXPIRED';
    }

    error = new AppError(message, statusCode, code, details);
  }

  const response = {
    success: false,
    error: {
      message: error.message,
      code: error.code || 'INTERNAL_ERROR'
    }
  };

  if (error.details) {
    response.error.details = error.details;
  }

  if (env.NODE_ENV !== 'production' && err.stack) {
    response.error.stack = err.stack;
  }

  return res.status(error.statusCode || 500).json(response);
}

module.exports = errorHandler;
