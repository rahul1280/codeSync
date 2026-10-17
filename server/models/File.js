const mongoose = require('mongoose');
const { SUPPORTED_LANGUAGES } = require('../utils/constants');

const fileSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
      minlength: [1, 'Filename must be at least 1 character'],
      maxlength: [100, 'Filename cannot exceed 100 characters']
    },
    language: {
      type: String,
      enum: SUPPORTED_LANGUAGES,
      default: 'javascript'
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound index on roomId and filename
fileSchema.index({ roomId: 1, filename: 1 }, { unique: true });
fileSchema.index({ roomId: 1 });

const File = mongoose.model('File', fileSchema);

module.exports = File;
