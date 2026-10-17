const crypto = require('crypto');
const Room = require('../models/Room');
const File = require('../models/File');
const FileVersion = require('../models/FileVersion');
const Message = require('../models/Message');
const AppError = require('../utils/AppError');
const { ROLES } = require('../utils/constants');

function hashInvitationToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

async function createRoom({ name, language = 'javascript', userId }) {
  const room = await Room.create({
    name: name.trim(),
    language,
    ownerId: userId,
    members: [
      {
        userId,
        role: ROLES.OWNER,
        joinedAt: new Date()
      }
    ]
  });

  // Create default starter file for new room
  const DEFAULT_FILENAMES = {
    javascript: 'index.js',
    python: 'main.py',
    html: 'index.html',
    css: 'style.css',
    cpp: 'main.cpp',
    java: 'Main.java',
    json: 'data.json'
  };

  const filename = DEFAULT_FILENAMES[language] || 'index.js';
  const initialContent = `// Welcome to ${name.trim()}!\nconsole.log("Ready to collaborate!");\n`;

  try {
    const file = await File.create({
      roomId: room._id,
      filename,
      language,
      creatorId: userId,
      content: initialContent
    });

    await FileVersion.create({
      fileId: file._id,
      roomId: room._id,
      savedBy: userId,
      content: initialContent,
      versionNumber: 1,
      message: 'Initial file creation'
    });
  } catch (err) {
    console.error('Could not create default file for room:', err);
  }

  return room;
}

async function getUserRooms(userId) {
  return Room.find({
    $or: [{ ownerId: userId }, { 'members.userId': userId }]
  })
    .populate('ownerId', 'name email avatarColor')
    .populate('members.userId', 'name email avatarColor')
    .sort({ updatedAt: -1 });
}

async function getRoomById(roomId) {
  const room = await Room.findById(roomId)
    .populate('ownerId', 'name email avatarColor')
    .populate('members.userId', 'name email avatarColor');

  if (!room) {
    throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  return room;
}

async function updateRoom(roomId, updateData) {
  const allowedUpdates = ['name', 'language'];
  const updatePayload = {};

  for (const field of allowedUpdates) {
    if (updateData[field] !== undefined) {
      updatePayload[field] = updateData[field];
    }
  }

  const room = await Room.findByIdAndUpdate(roomId, updatePayload, {
    new: true,
    runValidators: true
  })
    .populate('ownerId', 'name email avatarColor')
    .populate('members.userId', 'name email avatarColor');

  if (!room) {
    throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  return room;
}

async function deleteRoom(roomId) {
  const room = await Room.findByIdAndDelete(roomId);
  if (!room) {
    throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  // Cleanup related data
  await Promise.all([
    File.deleteMany({ roomId }),
    FileVersion.deleteMany({ roomId }),
    Message.deleteMany({ roomId })
  ]);

  return room;
}

async function createInvitation(roomId, createdBy, { role = ROLES.EDITOR, expiresInHours = 24 }) {
  const room = await Room.findById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashInvitationToken(rawToken);
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  room.invitations.push({
    token: hashedToken,
    createdBy,
    role,
    expiresAt,
    revoked: false
  });

  await room.save();

  return {
    rawToken,
    token: rawToken,
    code: rawToken,
    inviteCode: rawToken,
    expiresAt,
    role
  };
}

async function revokeInvitation(roomId, invitationToken) {
  const hashedToken = hashInvitationToken(invitationToken);
  const room = await Room.findById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  const invitation = room.invitations.find((inv) => inv.token === hashedToken);
  if (!invitation) {
    throw new AppError('Invitation not found', 404, 'INVITATION_NOT_FOUND');
  }

  invitation.revoked = true;
  await room.save();

  return { message: 'Invitation revoked successfully' };
}

async function joinRoomWithToken(userId, rawToken) {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new AppError('Invitation token or room code is required', 400, 'INVALID_INVITATION');
  }

  const cleanToken = rawToken.trim();
  const hashedToken = hashInvitationToken(cleanToken);

  let room = await Room.findOne({
    'invitations.token': hashedToken
  });

  let assignedRole = ROLES.EDITOR;

  if (room) {
    const invitation = room.invitations.find((inv) => inv.token === hashedToken);
    if (!invitation) {
      throw new AppError('Invalid invitation token', 400, 'INVALID_INVITATION');
    }
    if (invitation.revoked) {
      throw new AppError('This invitation has been revoked', 400, 'INVITATION_REVOKED');
    }
    if (new Date() > new Date(invitation.expiresAt)) {
      throw new AppError('This invitation has expired', 400, 'INVITATION_EXPIRED');
    }
    assignedRole = invitation.role || ROLES.EDITOR;
  } else if (/^[a-fA-F0-9]{24}$/.test(cleanToken)) {
    // Fallback: allow joining by direct roomId
    room = await Room.findById(cleanToken);
  }

  if (!room) {
    throw new AppError('Invalid or expired invitation token', 400, 'INVALID_INVITATION');
  }

  // Check if user is already a member or owner
  const isMember = room.members.some((m) => m.userId.toString() === userId.toString());
  const isOwner = room.ownerId && room.ownerId.toString() === userId.toString();

  if (!isMember && !isOwner) {
    room.members.push({
      userId,
      role: assignedRole,
      joinedAt: new Date()
    });
    await room.save();
  }

  return room;
}

async function leaveRoom(roomId, userId) {
  const room = await Room.findById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  if (room.ownerId.toString() === userId.toString()) {
    throw new AppError('Room owner cannot leave the room. Transfer ownership or delete the room.', 400, 'OWNER_CANNOT_LEAVE');
  }

  const initialLength = room.members.length;
  room.members = room.members.filter((m) => m.userId.toString() !== userId.toString());

  if (room.members.length === initialLength) {
    throw new AppError('You are not a member of this room', 400, 'NOT_A_MEMBER');
  }

  await room.save();
  return { message: 'Successfully left room' };
}

async function updateMemberRole(roomId, targetUserId, newRole) {
  const room = await Room.findById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  if (room.ownerId.toString() === targetUserId.toString()) {
    throw new AppError('Cannot change the role of the room owner', 400, 'CANNOT_MODIFY_OWNER_ROLE');
  }

  const member = room.members.find((m) => m.userId.toString() === targetUserId.toString());
  if (!member) {
    throw new AppError('Member not found in room', 404, 'MEMBER_NOT_FOUND');
  }

  member.role = newRole;
  await room.save();

  return room;
}

async function removeMember(roomId, targetUserId) {
  const room = await Room.findById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404, 'ROOM_NOT_FOUND');
  }

  if (room.ownerId.toString() === targetUserId.toString()) {
    throw new AppError('Cannot remove room owner', 400, 'CANNOT_REMOVE_OWNER');
  }

  const initialLength = room.members.length;
  room.members = room.members.filter((m) => m.userId.toString() !== targetUserId.toString());

  if (room.members.length === initialLength) {
    throw new AppError('User is not a member of this room', 404, 'MEMBER_NOT_FOUND');
  }

  await room.save();
  return { message: 'Member removed successfully' };
}

module.exports = {
  hashInvitationToken,
  createRoom,
  getUserRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  createInvitation,
  revokeInvitation,
  joinRoomWithToken,
  leaveRoom,
  updateMemberRole,
  removeMember
};
