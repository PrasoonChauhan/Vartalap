const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please fill all fields');
  }

  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    res.status(400);
    throw new Error('User with this email or username already exists');
  }

  // Handle avatar upload via multer-storage-cloudinary
  let avatar = '';
  let avatarPublicId = '';
  if (req.file) {
    avatar = req.file.path;           // Cloudinary secure URL
    avatarPublicId = req.file.filename; // Cloudinary public_id
  }

  const user = await User.create({ username, email, password, avatar, avatarPublicId });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400);
    throw new Error('Google credential is required');
  }

  // Verify Google ID token
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    res.status(401);
    throw new Error('Invalid Google token');
  }

  const { sub: googleId, email, name, picture } = payload;

  // Case 1: User already linked with this Google account
  let user = await User.findOne({ googleId });

  if (!user) {
    // Case 2: Existing local user with same email — link Google account
    user = await User.findOne({ email });

    if (user) {
      user.googleId = googleId;
      // Use Google photo as avatar if user doesn't have one
      if (!user.avatar) {
        user.avatar = picture || '';
      }
      await user.save();
    } else {
      // Case 3: Brand new user — create with Google profile
      // Generate a unique username from the Google name
      let baseUsername = name.replace(/\s+/g, '').toLowerCase().slice(0, 20);
      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        username,
        email,
        googleId,
        authProvider: 'google',
        avatar: picture || '',
      });
    }
  }

  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    token: generateToken(user._id),
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
});

// @desc    Update avatar
// @route   PUT /api/auth/avatar
// @access  Private
const updateAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }

  // Delete old avatar from Cloudinary
  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId);
  }

  user.avatar = req.file.path;
  user.avatarPublicId = req.file.filename;
  await user.save();

  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
  });
});

module.exports = { registerUser, loginUser, googleLogin, getMe, updateAvatar };

