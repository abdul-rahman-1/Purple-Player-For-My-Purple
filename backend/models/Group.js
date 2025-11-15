const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    groupCode: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      minlength: 16,
      maxlength: 16,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalSongs: {
      type: Number,
      default: 0,
    },
    totalMessages: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for groupCode
groupSchema.index({ groupCode: 1 }, { unique: true, sparse: true, name: 'groupCode_unique' });

module.exports = mongoose.model('Group', groupSchema);
