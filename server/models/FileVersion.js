const mongoose = require('mongoose');

const fileVersionSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    versionNumber: {
      type: Number,
      required: true
    },
    message: {
      type: String,
      default: '',
      maxlength: [200, 'Version message cannot exceed 200 characters']
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Index on [fileId, createdAt]
fileVersionSchema.index({ fileId: 1, createdAt: -1 });
fileVersionSchema.index({ fileId: 1, versionNumber: -1 });

const FileVersion = mongoose.model('FileVersion', fileVersionSchema);

module.exports = FileVersion;
