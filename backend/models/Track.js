const mongoose = require('mongoose');
const TrackSchema = new mongoose.Schema({
  title: String,
  artist: String,
  source: String, // 'youtube' or 'direct'
  url: String, // the link user added
  cover: String, // optional image URL
  message: String, // personal message
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: false } // Track belongs to group
},{ timestamps:true });
module.exports = mongoose.model('Track', TrackSchema);
