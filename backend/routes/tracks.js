const express = require("express");
const Track = require("../models/Track");
const router = express.Router();

// list all tracks
router.get("/", async (req, res) => {
  try {
    const items = await Track.find()
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error("❌ Fetch tracks error:", err);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

// get most played/recent song for "top song"
router.get("/top-song", async (req, res) => {
  try {
    const topTrack = await Track.findOne()
      .populate("addedBy", "name email")
      .sort({ createdAt: -1 });
    
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

    // Trim whitespace
    title = title.trim();
    artist = artist.trim();

    console.log(`📝 Saving track: "${title}" by "${artist}" (source: ${source})`);

    const t = new Track({
      title,
      artist,
      source,
      url,
      cover,
      message: message ? message.trim() : '',
      addedBy,
    });

    const saved = await t.save();
    console.log("✅ Track saved with ID:", saved._id);

    // Populate addedBy before sending response
    const populated = await Track.findById(saved._id).populate(
      "addedBy",
      "name email"
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

// delete a track (only by user who added it)
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
module.exports = router;
