const mongoose = require('mongoose');
const { EXECUTION_STATUS, EXECUTABLE_LANGUAGES } = require('../utils/constants');

const executionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: false
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: false
    },
    language: {
      type: String,
      required: true,
      enum: EXECUTABLE_LANGUAGES
    },
    code: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(EXECUTION_STATUS),
      default: EXECUTION_STATUS.PENDING
    },
    output: {
      type: String,
      default: ''
    },
    error: {
      type: String,
      default: ''
    },
    executionTime: {
      type: Number, // milliseconds
      default: 0
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

executionSchema.index({ userId: 1, createdAt: -1 });
executionSchema.index({ roomId: 1, createdAt: -1 });

const Execution = mongoose.model('Execution', executionSchema);

module.exports = Execution;
