const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { registerUser, loginUser, googleLogin, getMe, updateAvatar } = require('../controllers/authController');

router.post('/register', upload.single('avatar'), registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);

module.exports = router;
