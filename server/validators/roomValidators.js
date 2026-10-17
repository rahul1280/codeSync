const { body, param } = require('express-validator');
const { ROLES, SUPPORTED_LANGUAGES } = require('../utils/constants');

const createRoomValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Room name is required')
    .isLength({ min: 1, max: 100 }).withMessage('Room name must be between 1 and 100 characters'),
  body('language')
    .optional()
    .isIn(SUPPORTED_LANGUAGES).withMessage(`Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`)
];

const updateRoomValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Room name must be between 1 and 100 characters'),
  body('language')
    .optional()
    .isIn(SUPPORTED_LANGUAGES).withMessage(`Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`)
];

const createInvitationValidator = [
  body('role')
    .optional()
    .isIn([ROLES.EDITOR, ROLES.VIEWER]).withMessage('Invitation role must be editor or viewer'),
  body('expiresInHours')
    .optional()
    .isInt({ min: 1, max: 720 }).withMessage('expiresInHours must be an integer between 1 and 720 (30 days)')
];

const joinRoomValidator = [
  body().custom((value, { req }) => {
    const token = req.body.token || req.body.inviteCode;
    if (!token || !token.toString().trim()) {
      throw new Error('Invitation token or room code is required');
    }
    return true;
  })
];

const updateMemberValidator = [
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn([ROLES.EDITOR, ROLES.VIEWER]).withMessage('Role must be either editor or viewer')
];

module.exports = {
  createRoomValidator,
  updateRoomValidator,
  createInvitationValidator,
  joinRoomValidator,
  updateMemberValidator
};
