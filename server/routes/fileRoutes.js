const express = require('express');
const fileController = require('../controllers/fileController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validateRequest = require('../middlewares/validateRequest');
const File = require('../models/File');
const AppError = require('../utils/AppError');
const { ROLES } = require('../utils/constants');
const {
  createFileValidator,
  updateFileValidator,
  saveFileValidator,
  restoreVersionValidator
} = require('../validators/fileValidators');

const router = express.Router();

router.use(authenticate);

// Middleware to resolve roomId from fileId if req.params.roomId is not already present
async function resolveRoomFromFile(req, res, next) {
  try {
    if (req.params.roomId) {
      return next();
    }
    const { fileId } = req.params;
    if (!fileId) {
      return next(new AppError('File ID is required', 400, 'FILE_ID_REQUIRED'));
    }
    const file = await File.findById(fileId);
    if (!file) {
      return next(new AppError('File not found', 404, 'FILE_NOT_FOUND'));
    }
    req.params.roomId = file.roomId.toString();
    req.fileRecord = file;
    next();
  } catch (err) {
    next(err);
  }
}

// 1. Files under a specific room
router.get(
  '/room/:roomId',
  authorize([ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]),
  fileController.getRoomFiles
);

router.post(
  '/room/:roomId',
  authorize([ROLES.OWNER, ROLES.EDITOR]),
  createFileValidator,
  validateRequest,
  fileController.createFile
);

// Generic POST /files (with roomId in body)
router.post(
  '/',
  (req, res, next) => {
    if (req.body.roomId) {
      req.params.roomId = req.body.roomId;
    }
    next();
  },
  authorize([ROLES.OWNER, ROLES.EDITOR]),
  createFileValidator,
  validateRequest,
  fileController.createFile
);

// 2. Operations on specific file by fileId
router.get(
  '/:fileId',
  resolveRoomFromFile,
  authorize([ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]),
  fileController.getFile
);

router.patch(
  '/:fileId',
  resolveRoomFromFile,
  authorize([ROLES.OWNER, ROLES.EDITOR]),
  updateFileValidator,
  validateRequest,
  fileController.updateFile
);

router.delete(
  '/:fileId',
  resolveRoomFromFile,
  authorize([ROLES.OWNER, ROLES.EDITOR]),
  fileController.deleteFile
);

// 3. Save file content & versioning
router.post(
  '/:fileId/save',
  resolveRoomFromFile,
  authorize([ROLES.OWNER, ROLES.EDITOR]),
  saveFileValidator,
  validateRequest,
  fileController.saveFile
);

router.get(
  '/:fileId/versions',
  resolveRoomFromFile,
  authorize([ROLES.OWNER, ROLES.EDITOR, ROLES.VIEWER]),
  fileController.getVersions
);

router.post(
  '/:fileId/restore/:versionNumber',
  resolveRoomFromFile,
  authorize([ROLES.OWNER, ROLES.EDITOR]),
  restoreVersionValidator,
  validateRequest,
  fileController.restoreVersion
);

module.exports = router;
