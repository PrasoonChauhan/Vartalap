const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Escape regex special characters to prevent ReDoS
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Search users by username
// @route   GET /api/users/search?q=name
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.q
    ? { username: { $regex: escapeRegex(req.query.q), $options: 'i' } }
    : {};

  const users = await User.find({
    ...keyword,
    _id: { $ne: req.user._id }, // exclude self
  })
    .select('username avatar isOnline lastSeen')
    .limit(20);

  res.json(users);
});

// @desc    Get recent contacts
// @route   GET /api/users/recent-contacts
// @access  Private
const getRecentContacts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('recentContacts');

  // Sort by lastCallAt desc
  const sorted = user.recentContacts.sort(
    (a, b) => new Date(b.lastCallAt) - new Date(a.lastCallAt)
  );

  // Enrich with live online status
  const contactIds = sorted.map((c) => c.userId);
  const liveUsers = await User.find({ _id: { $in: contactIds } }).select(
    'isOnline lastSeen'
  );
  const liveMap = {};
  liveUsers.forEach((u) => {
    liveMap[u._id.toString()] = { isOnline: u.isOnline, lastSeen: u.lastSeen };
  });

  const enriched = sorted.map((c) => ({
    ...c.toObject(),
    ...(liveMap[c.userId.toString()] || {}),
  }));

  res.json(enriched);
});

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user);
});

// @desc    Update recent contacts after call
// @route   PUT /api/users/recent-contacts
// @access  Private
const updateRecentContacts = asyncHandler(async (req, res) => {
  const { contactIds } = req.body; // array of userIds from the call

  const contacts = await User.find({ _id: { $in: contactIds } }).select(
    'username avatar'
  );

  const user = await User.findById(req.user._id);

  for (const contact of contacts) {
    const existing = user.recentContacts.find(
      (c) => c.userId.toString() === contact._id.toString()
    );
    if (existing) {
      existing.lastCallAt = new Date();
      existing.avatar = contact.avatar;
    } else {
      user.recentContacts.push({
        userId: contact._id,
        username: contact.username,
        avatar: contact.avatar,
        lastCallAt: new Date(),
      });
    }
  }

  // Keep only latest 20 contacts
  user.recentContacts = user.recentContacts
    .sort((a, b) => new Date(b.lastCallAt) - new Date(a.lastCallAt))
    .slice(0, 20);

  await user.save();
  res.json({ message: 'Recent contacts updated' });
});

module.exports = { searchUsers, getRecentContacts, getUserById, updateRecentContacts };
