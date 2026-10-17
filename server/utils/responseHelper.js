function success(res, data = null, statusCode = 200, message = null) {
  const responseBody = {
    success: true
  };

  if (message) {
    responseBody.message = message;
  }

  if (data !== null) {
    responseBody.data = data;
  }

  return res.status(statusCode).json(responseBody);
}

function error(res, message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
  const responseBody = {
    success: false,
    error: {
      message,
      code
    }
  };

  if (details) {
    responseBody.error.details = details;
  }

  return res.status(statusCode).json(responseBody);
}

module.exports = {
  success,
  error
};
