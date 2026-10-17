const File = require('../models/File');
const FileVersion = require('../models/FileVersion');
const AppError = require('../utils/AppError');

async function createFile({ roomId, filename, language, creatorId, content = '' }) {
  const existing = await File.findOne({ roomId, filename });
  if (existing) {
    throw new AppError(`A file named "${filename}" already exists in this room`, 409, 'FILE_ALREADY_EXISTS');
  }

  const file = await File.create({
    roomId,
    filename,
    language,
    creatorId,
    content
  });

  // Create initial version 1
  await FileVersion.create({
    fileId: file._id,
    roomId,
    savedBy: creatorId,
    content,
    versionNumber: 1,
    message: 'Initial file creation'
  });

  return file;
}

async function getRoomFiles(roomId) {
  return File.find({ roomId })
    .populate('creatorId', 'name email avatarColor')
    .sort({ createdAt: 1 });
}

async function getFileById(fileId, roomId) {
  const query = { _id: fileId };
  if (roomId) query.roomId = roomId;

  const file = await File.findOne(query).populate('creatorId', 'name email avatarColor');
  if (!file) {
    throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
  }

  return file;
}

async function updateFileMetadata(fileId, roomId, { filename, language }) {
  const file = await getFileById(fileId, roomId);

  if (filename && filename !== file.filename) {
    const existing = await File.findOne({ roomId: file.roomId, filename });
    if (existing) {
      throw new AppError(`A file named "${filename}" already exists in this room`, 409, 'FILE_ALREADY_EXISTS');
    }
    file.filename = filename;
  }

  if (language) {
    file.language = language;
  }

  await file.save();
  return file;
}

async function saveFileContent({ fileId, roomId, userId, content, message = '' }) {
  const file = await getFileById(fileId, roomId);

  // Update current content
  file.content = content;
  await file.save();

  // Find latest version number
  const latestVersion = await FileVersion.findOne({ fileId }).sort({ versionNumber: -1 });
  const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

  const version = await FileVersion.create({
    fileId: file._id,
    roomId: file.roomId,
    savedBy: userId,
    content,
    versionNumber: nextVersionNumber,
    message: message || `Version ${nextVersionNumber}`
  });

  return { file, version };
}

async function getFileVersions(fileId, roomId) {
  await getFileById(fileId, roomId); // ensure file exists in room
  return FileVersion.find({ fileId, roomId })
    .populate('savedBy', 'name email avatarColor')
    .sort({ versionNumber: -1 });
}

async function restoreFileVersion(fileId, versionNumber, roomId, userId) {
  const file = await getFileById(fileId, roomId);

  const versionToRestore = await FileVersion.findOne({
    fileId,
    roomId,
    versionNumber: parseInt(versionNumber, 10)
  });

  if (!versionToRestore) {
    throw new AppError(`Version ${versionNumber} not found`, 404, 'VERSION_NOT_FOUND');
  }

  // Update file content with restored content
  file.content = versionToRestore.content;
  await file.save();

  // Create a new version marking the restoration
  const latestVersion = await FileVersion.findOne({ fileId }).sort({ versionNumber: -1 });
  const nextVersionNumber = (latestVersion ? latestVersion.versionNumber : 0) + 1;

  const newVersion = await FileVersion.create({
    fileId: file._id,
    roomId: file.roomId,
    savedBy: userId,
    content: versionToRestore.content,
    versionNumber: nextVersionNumber,
    message: `Restored from version ${versionNumber}`
  });

  return { file, restoredFrom: versionNumber, newVersion };
}

async function deleteFile(fileId, roomId) {
  const file = await getFileById(fileId, roomId);
  await File.deleteOne({ _id: file._id });
  await FileVersion.deleteMany({ fileId: file._id });
  return { message: 'File deleted successfully' };
}

module.exports = {
  createFile,
  getRoomFiles,
  getFileById,
  updateFileMetadata,
  saveFileContent,
  getFileVersions,
  restoreFileVersion,
  deleteFile
};
