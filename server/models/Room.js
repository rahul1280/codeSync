const mongoose = require('mongoose');
const { ROLES, SUPPORTED_LANGUAGES } = require('../utils/constants');

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.EDITOR
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const invitationSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: [ROLES.EDITOR, ROLES.VIEWER],
      default: ROLES.EDITOR
    },
    expiresAt: {
      type: Date,
      required: true
    },
    revoked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      minlength: [1, 'Room name must be at least 1 character'],
      maxlength: [100, 'Room name cannot exceed 100 characters']
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: {
      type: [memberSchema],
      default: []
    },
    invitations: {
      type: [invitationSchema],
      default: []
    },
    language: {
      type: String,
      enum: SUPPORTED_LANGUAGES,
      default: 'javascript'
    }
  },
  {
    timestamps: true
  }
);

roomSchema.index({ 'members.userId': 1 });
roomSchema.index({ ownerId: 1 });
roomSchema.index({ 'invitations.token': 1 });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
