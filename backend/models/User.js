const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  sessionId: { type: String, unique: true, sparse: true },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  currentlyListening: { type: String, default: null },
  lastListenedSong: { type: String, default: null }
},{ timestamps:true });
module.exports = mongoose.model('User', UserSchema);
