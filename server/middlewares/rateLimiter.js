const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const isTest = env.NODE_ENV === 'test';

function createLimiter(windowMs, max, message) {
  return rateLimit({
    windowMs,
    max: isTest ? 10000 : max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        message: message || 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    }
  });
}

// authLimiter: 10 req / 15 min
const authLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many authentication attempts. Please try again after 15 minutes.'
);

// apiLimiter: 100 req / 15 min
const apiLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Too many requests to the API. Please try again later.'
);

// executionLimiter: 10 req / min
const executionLimiter = createLimiter(
  60 * 1000,
  10,
  'Code execution rate limit exceeded. You can only execute code 10 times per minute.'
);

// chatLimiter: 30 req / min
const chatLimiter = createLimiter(
  60 * 1000,
  30,
  'Chat message rate limit exceeded.'
);

module.exports = {
  authLimiter,
  apiLimiter,
  executionLimiter,
  chatLimiter
};
