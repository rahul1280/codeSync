const persistenceService = require('../services/persistenceService');
const { success } = require('../utils/responseHelper');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const createFile = catchAsync(async (req, res) => {
  const roomId = req.params.roomId || req.body.roomId;
  if (!roomId) {
    throw new AppError('Room ID is required', 400, 'ROOM_ID_REQUIRED');
  }

  const { filename, language, content } = req.body;
  const file = await persistenceService.createFile({
    roomId,
    filename,
    language,
    creatorId: req.user.id,
    content: content || ''
  });

  return success(res, { file }, 201, 'File created successfully');
});

const getRoomFiles = catchAsync(async (req, res) => {
  const roomId = req.params.roomId;
  const files = await persistenceService.getRoomFiles(roomId);
  return success(res, { files }, 200);
});

const getFile = catchAsync(async (req, res) => {
  const { fileId, roomId } = req.params;
  const file = await persistenceService.getFileById(fileId, roomId);
  return success(res, { file }, 200);
});

const updateFile = catchAsync(async (req, res) => {
  const { fileId, roomId } = req.params;
  const { filename, language } = req.body;
  const file = await persistenceService.updateFileMetadata(fileId, roomId, {
    filename,
    language
  });
  return success(res, { file }, 200, 'File updated successfully');
});

const deleteFile = catchAsync(async (req, res) => {
  const { fileId, roomId } = req.params;
  const result = await persistenceService.deleteFile(fileId, roomId);
  return success(res, result, 200, 'File deleted successfully');
});

const saveFile = catchAsync(async (req, res) => {
  const { fileId, roomId } = req.params;
  const { content, message } = req.body;

  const result = await persistenceService.saveFileContent({
    fileId,
    roomId,
    userId: req.user.id,
    content,
    message
  });

  return success(res, result, 200, 'File saved and version created successfully');
});

const getVersions = catchAsync(async (req, res) => {
  const { fileId, roomId } = req.params;
  const versions = await persistenceService.getFileVersions(fileId, roomId);
  return success(res, { versions }, 200);
});

const restoreVersion = catchAsync(async (req, res) => {
  const { fileId, versionNumber, roomId } = req.params;
  const result = await persistenceService.restoreFileVersion(
    fileId,
    versionNumber,
    roomId,
    req.user.id
  );

  return success(res, result, 200, `File restored to version ${versionNumber}`);
});

module.exports = {
  createFile,
  getRoomFiles,
  getFile,
  updateFile,
  deleteFile,
  saveFile,
  getVersions,
  restoreVersion
};
