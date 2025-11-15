const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  sessionId: { type: String, unique: true, sparse: true },
  avatar: { type: String, default: null }, // base64 image string
  isGroupMode: { type: Boolean, default: false }, // Solo or Group
  groupId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Group', 
    default: null 
  }, // Reference to group (can have unlimited members)
  groupRole: {
    type: String,
    enum: { values: ['admin', 'member'], message: 'Invalid role' }
  },
  joinedGroupAt: {
    type: Date,
    default: null
  },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  currentlyListening: { type: String, default: null },
  lastListenedSong: { type: String, default: null }
},{ timestamps:true });

module.exports = mongoose.model('User', UserSchema);
