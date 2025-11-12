const express = require('express');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Register/Get or Create User
router.post('/register', async (req, res) => {
  try {
    const { name, email, sessionId } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }

    let user = await User.findOne({ email });

    if (user) {
      // User exists - update session
      user.sessionId = sessionId || uuidv4();
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();
    } else {
      // Create new user
      user = new User({
        name,
        email,
        sessionId: sessionId || uuidv4(),
        isOnline: true,
        lastSeen: new Date()
      });
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      sessionId: user.sessionId,
      isOnline: user.isOnline
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get all online users AND offline users with their status
router.get('/online', async (req, res) => {
  try {
    // Mark users offline if no heartbeat in 30+ seconds
    const thirtySecondsAgo = new Date(Date.now() - 30000);
    await User.updateMany(
      { isOnline: true, lastSeen: { $lt: thirtySecondsAgo } },
      { isOnline: false }
    );

    // Get all users (both online and offline)
    const users = await User.find().select('name email currentlyListening lastSeen isOnline').sort({ lastSeen: -1 });
    res.json(users);
  } catch (err) {
    console.error('Online users error:', err);
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

// Update user listening status
router.put('/listening/:userId', async (req, res) => {
  try {
    const { songTitle, songArtist } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        currentlyListening: songTitle ? `${songTitle}${songArtist ? ' - ' + songArtist : ''}` : null,
        lastListenedSong: songTitle,
        lastSeen: new Date()
      },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    console.error('Update listening error:', err);
    res.status(500).json({ error: 'Failed to update listening status' });
  }
});

// Set user offline
router.put('/offline/:userId', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isOnline: false, lastSeen: new Date() },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    console.error('Offline error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Get user activity status
router.get('/status/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select('name email isOnline currentlyListening lastSeen lastListenedSong');
    if (!user) {
      return res.json({ isOnline: false, lastSeen: null });
    }
    res.json(user);
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// Keep user online (heartbeat)
router.post('/heartbeat/:userId', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { lastSeen: new Date(), isOnline: true },
      { new: true }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Heartbeat error:', err);
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

module.exports = router;
