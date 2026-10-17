const authService = require('../services/authService');
const { success } = require('../utils/responseHelper');
const catchAsync = require('../utils/catchAsync');

const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, token } = await authService.registerUser({ name, email, password });

  authService.setTokenCookie(res, token);

  return success(
    res,
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
        createdAt: user.createdAt
      },
      token
    },
    201,
    'User registered successfully'
  );
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.loginUser({ email, password });

  authService.setTokenCookie(res, token);

  return success(
    res,
    {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
        createdAt: user.createdAt
      },
      token
    },
    200,
    'Logged in successfully'
  );
});

const logout = catchAsync(async (req, res) => {
  authService.clearTokenCookie(res);
  return success(res, null, 200, 'Logged out successfully');
});

const getMe = catchAsync(async (req, res) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : null);
  return success(res, { user: req.user, token }, 200);
});

module.exports = {
  register,
  login,
  logout,
  getMe
};
