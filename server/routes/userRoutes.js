const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  searchUsers,
  getRecentContacts,
  getUserById,
  updateRecentContacts,
} = require('../controllers/userController');

router.get('/search', protect, searchUsers);
router.get('/recent-contacts', protect, getRecentContacts);
router.put('/recent-contacts', protect, updateRecentContacts);
router.get('/:id', protect, getUserById);

module.exports = router;
