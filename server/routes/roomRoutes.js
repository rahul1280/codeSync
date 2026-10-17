const express = require('express');
const roomController = require('../controllers/roomController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validateRequest = require('../middlewares/validateRequest');
const { ROLES } = require('../utils/constants');
const fileController = require('../controllers/fileController');
const {
  createFileValidator
} = require('../validators/fileValidators');
const {
  createRoomValidator,
  updateRoomValidator,
  createInvitationValidator,
  joinRoomValidator,
  updateMemberValidator
} = require('../validators/roomValidators');

const router = express.Router();

// All room routes require authentication
router.use(authenticate);

// Join room via invitation token (no specific roomId in URL)
router.post(
  '/join',
  joinRoomValidator,
  validateRequest,
  roomController.joinRoom
);

// Room CRUD
router.post(
  '/',
  createRoomValidator,
  validateRequest,
  roomController.createRoom
);

router.get(
  '/',
  roomController.getRooms
);

router.get(
  '/:roomId',
  authorize([ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]),
  roomController.getRoom
);

router.patch(
  '/:roomId',
  authorize([ROLES.OWNER]),
  updateRoomValidator,
  validateRequest,
  roomController.updateRoom
);

router.put(
  '/:roomId',
  authorize([ROLES.OWNER]),
  updateRoomValidator,
  validateRequest,
  roomController.updateRoom
);

router.delete(
  '/:roomId',
  authorize([ROLES.OWNER]),
  roomController.deleteRoom
);

// Invitations
router.post(
  '/:roomId/invitations',
  authorize([ROLES.OWNER, ROLES.EDITOR]),
  createInvitationValidator,
  validateRequest,
  roomController.createInvitation
);

router.delete(
  '/:roomId/invitations/:token',
  authorize([ROLES.OWNER, ROLES.EDITOR]),
  roomController.revokeInvitation
);

// Membership management
router.post(
  '/:roomId/leave',
  authorize([ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]),
  roomController.leaveRoom
);

router.patch(
  '/:roomId/members/:userId',
  authorize([ROLES.OWNER]),
  updateMemberValidator,
  validateRequest,
  roomController.updateMember
);

router.delete(
  '/:roomId/members/:userId',
  authorize([ROLES.OWNER]),
  roomController.removeMember
);

// File management within room
router.get(
  '/:roomId/files',
  authorize([ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]),
  fileController.getRoomFiles
);

router.post(
  '/:roomId/files',
  authorize([ROLES.OWNER, ROLES.EDITOR]),
  createFileValidator,
  validateRequest,
  fileController.createFile
);

module.exports = router;
