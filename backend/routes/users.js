const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const router = express.Router();
const Group = require('../models/Group');

// Utility function to generate unique 16-character code
function generateGroupCode() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

// ============ REGISTRATION ============

// Step 1: Register user with email, name, password, and avatar
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, avatar, groupCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({ error: 'Password must contain at least one letter and one number' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const sessionId = uuidv4();

    // Create base user (no group yet)
    const user = new User({
      name,
      email,
      passwordHash,
      avatar: avatar || null,
      sessionId,
      isOnline: true,
      lastSeen: new Date()
    });

    await user.save();

    // ✅ CASE 1 — Join existing group using groupCode
    if (groupCode && groupCode.trim() !== '') {
      const existingGroup = await Group.findOne({ groupCode: groupCode.trim().toUpperCase() });
      if (existingGroup) {
        existingGroup.members.push({
          userId: user._id,
          role: 'member',
          joinedAt: new Date()
        });
        await existingGroup.save();

        user.isGroupMode = true;
        user.groupId = existingGroup._id;
        user.groupRole = 'member';
        user.joinedGroupAt = new Date();
        await user.save();

        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isOnline: true,
          isGroupMode: true,
          groupId: existingGroup._id,
          groupRole: 'member',
          joinedGroupAt: user.joinedGroupAt,
          groupCode: existingGroup.groupCode,
          groupName: existingGroup.groupName,
          message: `Joined existing group: ${existingGroup.groupName}`
        });
      } else {
        // invalid code fallback
        return res.status(404).json({ error: 'Invalid group code' });
      }
    }

    // ✅ CASE 2 — No group code: create a new group
    const newGroup = new Group({
      groupName: `${name}'s Group`,
      groupCode: generateGroupCode(),
      members: [
        {
          userId: user._id,
          role: 'admin',
          joinedAt: new Date()
        }
      ],
      totalSongs: 0,
      totalMessages: 0
    });

    await newGroup.save();

    user.isGroupMode = true;
    user.groupId = newGroup._id;
    user.groupRole = 'admin';
    user.joinedGroupAt = new Date();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isOnline: true,
      isGroupMode: true,
      groupId: newGroup._id,
      groupRole: 'admin',
      joinedGroupAt: user.joinedGroupAt,
      groupCode: newGroup.groupCode,
      groupName: newGroup.groupName,
      message: 'User registered and new group created successfully!'
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});


// ============ LOGIN ============

// Step 2: Login with email and password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Success - update user status
    user.isOnline = true;
    user.lastSeen = new Date();
    user.sessionId = uuidv4();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      sessionId: user.sessionId,
      isOnline: true,
      isGroupMode: user.isGroupMode,
      groupId: user.groupId,
      groupRole: user.groupRole,
      joinedGroupAt: user.joinedGroupAt
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ============ GROUP MANAGEMENT ============

// Step 3a: Generate unique group code for user (DEPRECATED - Use /join-group with createNew instead)
// This endpoint is deprecated because it only creates a user.groupCode field but doesn't create a Group document.
// When another user tries to join with this code, Group.findOne() returns null causing "Invalid group code" error.
// Frontend should use POST /join-group/:userId with { createNew: true, groupName: "..." } instead.
router.post('/generate-group-code/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already in a group
    if (user.groupId) {
      return res.status(400).json({ error: 'You are already in a group. Leave first.' });
    }

    // Return deprecation warning with instructions
    return res.status(410).json({ 
      error: 'Endpoint deprecated',
      message: 'Please use POST /api/users/join-group/:userId with createNew=true instead',
      example: {
        method: 'POST',
        url: `/api/users/join-group/${userId}`,
        body: {
          createNew: true,
          groupName: 'My Group Name'
        }
      },
      reason: 'This endpoint did not create a Group document, causing join failures'
    });
  } catch (err) {
    console.error('Generate code error:', err);
    res.status(500).json({ error: 'Failed to generate group code' });
  }
});

// Step 3b: Create new group or join existing group using group code
router.post('/join-group/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { groupCode, groupName, createNew } = req.body;

    // Find current user
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already in a group
    if (currentUser.groupId) {
      return res.status(400).json({ error: 'You are already in a group. Leave first.' });
    }

    let Group = require('../models/Group');

    if (createNew) {
      // CREATE NEW GROUP
      if (!groupName || !groupName.trim()) {
        return res.status(400).json({ error: 'Group name required' });
      }

      // Generate unique 16-char group code
      const generateGroupCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 16; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      const newGroupCode = generateGroupCode();

      // Create new group with current user as admin
      const newGroup = new Group({
        groupName: groupName.trim(),
        groupCode: newGroupCode,
        members: [
          {
            userId: currentUser._id,
            role: 'admin',
            joinedAt: new Date()
          }
        ],
        totalSongs: 0,
        totalMessages: 0
      });

      await newGroup.save();
      console.log('✅ New group created:', newGroup.groupCode, 'by', currentUser.name);

      // Update user
      await User.updateOne(
        { _id: currentUser._id },
        {
          $set: {
            isGroupMode: true,
            groupId: newGroup._id,
            groupRole: 'admin',
            joinedGroupAt: new Date()
          }
        }
      );

      res.json({
        _id: currentUser._id,
        name: currentUser.name,
        groupId: newGroup._id,
        groupCode: newGroupCode,
        groupName: newGroup.groupName,
        groupRole: 'admin',
        message: 'Group created successfully! Share code to invite others.'
      });
    } else {
      // JOIN EXISTING GROUP
      if (!groupCode || !groupCode.trim()) {
        return res.status(400).json({ error: 'Group code required' });
      }

      // Find group by code
      const group = await Group.findOne({ groupCode: groupCode.toUpperCase().trim() });
      if (!group) {
        return res.status(404).json({ error: 'Invalid group code' });
      }

      console.log('✅ Group found:', group.groupCode, 'members:', group.members.length);

      // Check if user already in this group
      const alreadyMember = group.members.some(m => m.userId.toString() === userId);
      if (alreadyMember) {
        return res.status(400).json({ error: 'You are already in this group' });
      }

      // Add user to group
      group.members.push({
        userId: currentUser._id,
        role: 'member',
        joinedAt: new Date()
      });

      await group.save();
      console.log('✅ User added to group. Total members:', group.members.length);

      // Update user
      await User.updateOne(
        { _id: currentUser._id },
        {
          $set: {
            isGroupMode: true,
            groupId: group._id,
            groupRole: 'member',
            joinedGroupAt: new Date()
          }
        }
      );

      res.json({
        _id: currentUser._id,
        name: currentUser.name,
        groupId: group._id,
        groupCode: group.groupCode,
        groupName: group.groupName,
        groupRole: 'member',
        membersCount: group.members.length,
        message: `Successfully joined group: ${group.groupName}`
      });
    }
  } catch (err) {
    console.error('Join group error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to join group' });
  }
});

// DEPRECATED ENDPOINTS - These use obsolete fields (groupMemberId, groupCode)
// These endpoints are kept for backwards compatibility but should not be used.
// Use the proper Group model endpoints below instead.

// Get group partner info (DEPRECATED - Use GET /group/members/:userId instead)
router.get('/group-partner/:userId', async (req, res) => {
  try {
    return res.status(410).json({ 
      error: 'Endpoint deprecated',
      message: 'Please use GET /api/users/group/members/:userId instead',
      reason: 'This endpoint uses obsolete groupMemberId field. Use Group model instead.'
    });
  } catch (err) {
    console.error('Get partner error:', err);
    res.status(500).json({ error: 'Failed to get partner info' });
  }
});

// ============ EXISTING ENDPOINTS ============

// Get online users (group-filtered if user in group, solo-mode returns empty)
router.get('/online', async (req, res) => {
  try {
    const userId = req.query.userId; // Optional: pass userId to get only group members

    // Mark users offline if no heartbeat in 30+ seconds
    const thirtySecondsAgo = new Date(Date.now() - 30000);
    await User.updateMany(
      { isOnline: true, lastSeen: { $lt: thirtySecondsAgo } },
      { isOnline: false }
    );

    // If userId provided, return only their group members
    if (userId) {
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.isGroupMode && user.groupId) {
        // Group user: return only group members
        let Group = require('../models/Group');
        const group = await Group.findById(user.groupId);
        
        if (!group) {
          return res.status(404).json({ error: 'Group not found' });
        }

        const memberIds = group.members.map(m => m.userId.toString());
        const users = await User.find({ _id: { $in: memberIds } })
          .select('name email avatar currentlyListening lastSeen isOnline isGroupMode')
          .sort({ lastSeen: -1 });
        
        return res.json(users);
      } else {
        // Solo user: return empty (they don't see who's online)
        return res.json([]);
      }
    }

    // No userId provided - for backwards compatibility, return empty to avoid data leaks
    res.json([]);
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
    const user = await User.findOne({ email: req.params.email }).select('name email avatar isOnline currentlyListening lastSeen lastListenedSong isGroupMode');
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

// ========== GROUP ENDPOINTS ==========

// Get all members of user's group
router.get('/group/members/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.groupId) {
      return res.status(400).json({ error: 'User not in a group' });
    }

    let Group = require('../models/Group');
    const group = await Group.findById(user.groupId).populate('members.userId', 'name email avatar isOnline currentlyListening lastSeen');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Return only group members with their details
const members = group.members
  .filter(m => m.userId) // ✅ filter out null refs
  .map(m => ({
    userId: m.userId._id,
    name: m.userId.name,
    email: m.userId.email,
    avatar: m.userId.avatar,
    isOnline: m.userId.isOnline,
    currentlyListening: m.userId.currentlyListening,
    lastSeen: m.userId.lastSeen,
    role: m.role,
    joinedAt: m.joinedAt
  }));


    res.json({
      groupId: group._id,
      groupName: group.groupName,
      groupCode: group.groupCode,
      members: members,
      totalMembers: group.members.length,
      totalSongs: group.totalSongs,
      totalMessages: group.totalMessages,
      createdAt: group.createdAt
    });
  } catch (err) {
    console.error('Get group members error:', err);
    res.status(500).json({ error: 'Failed to fetch group members' });
  }
});

// Get group info
router.get('/group/info/:groupId', async (req, res) => {
  try {
    let Group = require('../models/Group');
    const group = await Group.findById(req.params.groupId).populate('members.userId', 'name email avatar isOnline');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Filter out null refs before mapping (in case a user was deleted)
    const members = group.members
      .filter(m => m.userId) // ✅ Skip null/undefined userId references
      .map(m => ({
        userId: m.userId._id,
        name: m.userId.name,
        email: m.userId.email,
        avatar: m.userId.avatar,
        isOnline: m.userId.isOnline,
        role: m.role,
        joinedAt: m.joinedAt
      }));

    res.json({
      groupId: group._id,
      groupName: group.groupName,
      groupCode: group.groupCode,
      members: members,
      totalMembers: members.length, // Use filtered count
      totalSongs: group.totalSongs,
      totalMessages: group.totalMessages,
      createdAt: group.createdAt
    });
  } catch (err) {
    console.error('Get group info error:', err);
    res.status(500).json({ error: 'Failed to fetch group info' });
  }
});

// Leave group
router.post('/leave-group/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.groupId) {
      return res.status(400).json({ error: 'User not in a group' });
    }

    let Group = require('../models/Group');
    const group = await Group.findById(user.groupId);

    // Remove user from group members
    group.members = group.members.filter(m => m.userId.toString() !== req.params.userId);

    if (group.members.length === 0) {
      // Delete group if empty
      await Group.deleteOne({ _id: group._id });
      console.log('✅ Group deleted (no members):', group.groupCode);
    } else if (user.groupRole === 'admin') {
      // Assign new admin if current user was admin
      group.members[0].role = 'admin';
      await group.save();
      console.log('✅ New admin assigned:', group.members[0].userId.name);
    } else {
      await group.save();
    }

    // Update user to solo mode
    await User.updateOne(
      { _id: req.params.userId },
      {
        $set: {
          isGroupMode: false,
          groupId: null,
          groupRole: null,
          joinedGroupAt: null
        }
      }
    );

    res.json({ message: 'Successfully left group', groupDeleted: group.members.length === 0 });
  } catch (err) {
    console.error('Leave group error:', err);
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

// ============ PROFILE MANAGEMENT ============

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('groupId');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      sessionId: user.sessionId,
      isOnline: user.isOnline,
      isGroupMode: user.isGroupMode,
      groupId: user.groupId,
      groupRole: user.groupRole,
      joinedGroupAt: user.joinedGroupAt,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile (name and avatar)
router.put('/profile/:userId', async (req, res) => {
  try {
    const { name, avatar } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $set: {
          name: name.trim(),
          avatar: avatar || null
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      sessionId: user.sessionId,
      isOnline: user.isOnline,
      isGroupMode: user.isGroupMode,
      groupId: user.groupId,
      groupRole: user.groupRole,
      joinedGroupAt: user.joinedGroupAt
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password/:userId', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords required' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate new password strength (minimum 6 characters, at least one letter and one number)
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({ error: 'New password must contain at least one letter and one number' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await User.updateOne(
      { _id: req.params.userId },
      { $set: { passwordHash: newPasswordHash } }
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Send password reset email
router.post('/reset-email/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // In a real app, you would send an email here
    // For now, we'll just confirm the request
    console.log(`📧 Password reset email requested for: ${user.email}`);
    
    res.json({ 
      message: 'Password reset email sent',
      note: 'Contact abdulrahmanstd955@gmail.com for password reset assistance'
    });
  } catch (err) {
    console.error('Reset email error:', err);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

// Delete account
// Delete account and auto logout
router.delete('/delete-account/:userId', async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.params.userId;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Import models dynamically (avoid circular refs)
    const Group = require('../models/Group');
    const Track = require('../models/Track');

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // --- Step 1: Mark user offline immediately
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();

    // --- Step 2: Handle group cleanup
    if (user.isGroupMode && user.groupId) {
      const group = await Group.findById(user.groupId);

      if (group) {
        // Remove this user from group's member list
        group.members = group.members.filter(
          (m) => m.userId.toString() !== user._id.toString()
        );

        if (group.members.length === 0) {
          // Delete group if empty
          await Group.deleteOne({ _id: group._id });
        } else if (user.groupRole === 'admin') {
          // If user was admin, promote first member to admin
          group.members[0].role = 'admin';
          await group.save();
        } else {
          await group.save();
        }
      }
    }

    // --- Step 3: Delete all user's tracks
    await Track.deleteMany({ userId });

    // --- Step 4: Invalidate session globally (auto logout all devices)
    const invalidSessionId = uuidv4(); // random new session
    await User.updateOne(
      { _id: userId },
      { sessionId: invalidSessionId, isOnline: false }
    );

    // --- Step 5: Delete the user account
    await User.deleteOne({ _id: userId });

    // --- Step 6: Return logout instruction to frontend
    return res.json({
      message: 'Account deleted successfully. User logged out from all sessions.',
      shouldLogout: true
    });
  } catch (err) {
    console.error('❌ Delete account error:', err);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});



module.exports = router;