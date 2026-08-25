const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');

// @desc    Get chat history for a room (available during active call)
// @route   GET /api/chat/:roomId
// @access  Private
const getChatHistory = asyncHandler(async (req, res) => {
  const messages = await Message.find({ roomId: req.params.roomId })
    .sort({ createdAt: 1 })
    .limit(200);

  res.json(messages);
});

// @desc    Delete all messages in a room (Privacy Mode cleanup)
// @route   DELETE /api/chat/:roomId
// @access  Private
const deleteRoomChat = asyncHandler(async (req, res) => {
  await Message.deleteMany({ roomId: req.params.roomId });
  res.json({ message: 'Chat deleted' });
});

module.exports = { getChatHistory, deleteRoomChat };
