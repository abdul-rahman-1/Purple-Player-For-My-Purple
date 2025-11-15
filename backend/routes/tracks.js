const express = require("express");
const Track = require("../models/Track");
const router = express.Router();

// list all tracks - NOW REQUIRES userId to filter by group
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "userId query parameter is required" });
    }

    const User = require("../models/User");
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If user is in a group, only return that group's tracks
    if (user.groupId) {
      const items = await Track.find({ groupId: user.groupId })
        .populate("addedBy", "name email avatar")
        .sort({ createdAt: -1 });
      return res.json(items);
    }

    // If user not in group, return empty array (no tracks visible)
    res.json([]);
  } catch (err) {
    console.error("❌ Fetch tracks error:", err);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

// get most played/recent song for "top song" - NOW filtered by user's group
router.get("/top-song", async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "userId query parameter is required" });
    }

    const User = require("../models/User");
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let topTrack;
    
    // If user is in a group, get top track from that group only
    if (user.groupId) {
      topTrack = await Track.findOne({ groupId: user.groupId })
        .populate("addedBy", "name email avatar")
        .sort({ createdAt: -1 });
    }
    
    if (!topTrack) {
      return res.json(null);
    }
    
    res.json(topTrack);
  } catch (err) {
    console.error("❌ Top song error:", err);
    res.status(500).json({ error: "Failed to fetch top song" });
  }
});

// add a track - title and artist are NOW REQUIRED (extracted from iframe on frontend)
router.post("/", async (req, res) => {
  try {
    let { title, artist, source, url, cover, message, addedBy } = req.body;

    // Validate required fields
    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ 
        error: "invalid_url", 
        message: "Please provide a valid URL starting with http:// or https://" 
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ 
        error: "title_required", 
        message: "Song title is required" 
      });
    }

    if (!artist || !artist.trim()) {
      return res.status(400).json({ 
        error: "artist_required", 
        message: "Artist name is required" 
      });
    }

    if (!addedBy) {
      return res.status(400).json({ 
        error: "addedBy_required", 
        message: "User ID is required" 
      });
    }

    // Fetch user to get groupId
    const User = require("../models/User");
    const user = await User.findById(addedBy);
    
    if (!user) {
      return res.status(404).json({ 
        error: "user_not_found", 
        message: "User not found" 
      });
    }

    // Trim whitespace
    title = title.trim();
    artist = artist.trim();

    console.log(`📝 Saving track: "${title}" by "${artist}" (source: ${source}, groupId: ${user.groupId})`);

    const t = new Track({
      title,
      artist,
      source,
      url,
      cover,
      message: message ? message.trim() : '',
      addedBy,
      groupId: user.groupId // IMPORTANT: Assign to user's group
    });

    const saved = await t.save();
    console.log("✅ Track saved with ID:", saved._id);

    // Populate addedBy before sending response
    const populated = await Track.findById(saved._id).populate(
      "addedBy",
      "name email avatar"
    );
    
    res.json(populated);
  } catch (err) {
    console.error("❌ Add track error:", err);
    res.status(500).json({ 
      error: "Failed to add track", 
      message: err.message 
    });
  }
});

// simple proxy to stream direct audio files (use carefully)
router.get("/proxy", async (req, res) => {
  const { url } = req.query;
  if (!url || !/^https?:\/\//i.test(url))
    return res.status(400).send("bad_url");
  // SECURITY NOTE: this proxy is minimal — in production add allowlist & rate limits
  try {
    const r = await fetch(url);
    // copy headers for content-type and length
    if (r.headers.get("content-type"))
      res.setHeader("content-type", r.headers.get("content-type"));
    r.body.pipe(res);
  } catch (err) {
    res.status(502).send("proxy_error");
  }
});

// delete a track (only by user who added it, and must be in same group)
router.delete("/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const trackId = req.params.id;

    console.log(`🗑️ Delete request for track: ${trackId}, by user: ${userId}`);

    if (!userId) {
      return res.status(400).json({ 
        error: "user_id_required",
        message: "User ID is required to delete a track"
      });
    }

    const User = require("../models/User");
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: "user_not_found",
        message: "User not found"
      });
    }

    const track = await Track.findById(trackId);

    if (!track) {
      console.warn(`⚠️ Track not found: ${trackId}`);
      return res.status(404).json({ 
        error: "track_not_found",
        message: "This track no longer exists"
      });
    }

    // Check if user is the one who added this track
    const trackCreatorId = track.addedBy.toString();
    if (trackCreatorId !== userId) {
      console.warn(`⚠️ Unauthorized delete attempt: user ${userId} tried to delete track added by ${trackCreatorId}`);
      return res.status(403).json({ 
        error: "only_creator_can_delete",
        message: "Only the person who added this song can delete it"
      });
    }

    // SECURITY: Verify track belongs to user's group (can't delete tracks from other groups)
    if (track.groupId && user.groupId && track.groupId.toString() !== user.groupId.toString()) {
      console.warn(`⚠️ Security: User tried to delete track from different group`);
      return res.status(403).json({ 
        error: "track_from_different_group",
        message: "You cannot delete tracks from other groups"
      });
    }

    await Track.findByIdAndDelete(trackId);
    console.log(`✅ Track deleted: ${trackId}`);
    res.json({ ok: true, message: "Track deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ 
      error: "delete_failed",
      message: err.message 
    });
  }
});

// ========== GROUP TRACKS ENDPOINTS ==========

// Get tracks shared only within user's group
router.get("/group/shared/:userId", async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.groupId) {
      return res.status(400).json({ error: "User not in a group" });
    }

    // Find all tracks added by users in the same group
    let Group = require("../models/Group");
    const group = await Group.findById(user.groupId);
    
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const memberIds = group.members.map(m => m.userId);
    
    // Find tracks added only by group members
    const tracks = await Track.find({ addedBy: { $in: memberIds } })
      .populate("addedBy", "name email avatar")
      .sort({ createdAt: -1 });

    res.json({
      groupId: group._id,
      groupName: group.groupName,
      membersCount: group.members.length,
      tracksCount: tracks.length,
      tracks: tracks
    });
  } catch (err) {
    console.error("❌ Group tracks error:", err);
    res.status(500).json({ error: "Failed to fetch group tracks" });
  }
});

// Get individual user's track count
router.get("/user/:userId/count", async (req, res) => {
  try {
    const Track = require("../models/Track");
    const count = await Track.countDocuments({ addedBy: req.params.userId });
    res.json({ userId: req.params.userId, tracksCount: count });
  } catch (err) {
    console.error("❌ User track count error:", err);
    res.status(500).json({ error: "Failed to count tracks" });
  }
});

// Get all tracks by specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const tracks = await Track.find({ addedBy: req.params.userId })
      .populate("addedBy", "name email avatar")
      .sort({ createdAt: -1 });
    
    res.json({
      userId: req.params.userId,
      tracksCount: tracks.length,
      tracks: tracks
    });
  } catch (err) {
    console.error("❌ User tracks error:", err);
    res.status(500).json({ error: "Failed to fetch user tracks" });
  }
});

module.exports = router;
