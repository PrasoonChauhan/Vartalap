const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getChatHistory, deleteRoomChat } = require('../controllers/chatController');

router.get('/:roomId', protect, getChatHistory);
router.delete('/:roomId', protect, deleteRoomChat);

module.exports = router;
