const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: String,
      avatar: String,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

module.exports = mongoose.model('Message', messageSchema);
