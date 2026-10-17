const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const mongoose = require('mongoose');

// Schemas for fallback or direct model registration
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    avatarColor: { type: String }
  },
  { timestamps: true }
);

const memberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'editor' },
    joinedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [memberSchema], default: [] }
  },
  { timestamps: true }
);

const fileSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    filename: { type: String, required: true }
  },
  { timestamps: true }
);

function getModels() {
  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
  const File = mongoose.models.File || mongoose.model('File', fileSchema);
  return { User, Room, File };
}

/**
 * Verify JWT token and return decoded payload
 * @param {string} token
 * @param {string} secret
 * @returns {object|null}
 */
function verifyToken(token, secret) {
  if (!token || !secret) {
    return null;
  }
  try {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    return jwt.verify(cleanToken, secret);
  } catch (err) {
    return null;
  }
}

/**
 * Extract token from HTTP Cookie header
 * @param {string} cookieHeader
 * @returns {string|null}
 */
function extractTokenFromCookies(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return null;
  }
  try {
    const cookies = cookie.parse(cookieHeader);
    const token = cookies.token || cookies.jwt || null;
    if (!token) {
      return null;
    }
    return token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  } catch (err) {
    return null;
  }
}

/**
 * Parse docName in format 'room:{roomId}:file:{fileId}'
 * @param {string} docName
 * @returns {{ roomId: string, fileId: string }|null}
 */
function parseDocName(docName) {
  if (!docName || typeof docName !== 'string') {
    return null;
  }
  const colonMatch = docName.match(/^room:([^:]+):file:([^:]+)$/);
  if (colonMatch) {
    return {
      roomId: colonMatch[1],
      fileId: colonMatch[2]
    };
  }
  const hyphenMatch = docName.match(/^room-([^-]+)-file-(.+)$/);
  if (hyphenMatch) {
    return {
      roomId: hyphenMatch[1],
      fileId: hyphenMatch[2]
    };
  }
  return null;
}

/**
 * Connect to MongoDB and verify room membership and permissions
 * docName format: 'room:{roomId}:file:{fileId}'
 * @param {string} userId
 * @param {string} docName
 * @param {string} [mongoUri]
 * @returns {Promise<{ user: object, role: string, roomId: string, fileId: string }|null>}
 */
async function fetchUserAndRoomAccess(userId, docName, mongoUri) {
  if (!userId || !docName) {
    return null;
  }

  const parsed = parseDocName(docName);
  if (!parsed) {
    return null;
  }

  if (mongoose.connection.readyState === 0) {
    if (!mongoUri) {
      throw new Error('[auth] Cannot query MongoDB: connection is disconnected and no mongoUri provided');
    }
    await mongoose.connect(mongoUri);
  }

  const { User, Room, File } = getModels();

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(parsed.roomId)) {
    return null;
  }

  // 1. Fetch user
  const user = await User.findById(userId).select('-passwordHash -password').lean();
  if (!user) {
    return null;
  }

  // 2. Fetch room
  const room = await Room.findById(parsed.roomId).lean();
  if (!room) {
    return null;
  }

  // 3. Optional: Verify file exists in room if valid ObjectId
  if (mongoose.Types.ObjectId.isValid(parsed.fileId)) {
    const file = await File.findOne({ _id: parsed.fileId, roomId: parsed.roomId }).lean();
    if (!file) {
      return null;
    }
  }

  // 4. Verify membership and role
  const isOwner = room.ownerId && room.ownerId.toString() === userId.toString();
  if (isOwner) {
    return {
      user,
      role: 'owner',
      roomId: parsed.roomId,
      fileId: parsed.fileId
    };
  }

  const member = Array.isArray(room.members)
    ? room.members.find((m) => m.userId && m.userId.toString() === userId.toString())
    : null;

  if (member) {
    return {
      user,
      role: member.role || 'editor',
      roomId: parsed.roomId,
      fileId: parsed.fileId
    };
  }

  return null;
}

module.exports = {
  verifyToken,
  extractTokenFromCookies,
  parseDocName,
  fetchUserAndRoomAccess
};
