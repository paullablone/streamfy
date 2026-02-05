import express from 'express';
import { verifyToken } from '../auth.js';
import StreamDJ from '../models/StreamDJ.js';

const router = express.Router();

// Initialize DJ for a channel
router.post('/init/:channelId', verifyToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    
    let dj = await StreamDJ.findOne({ channelId });
    
    if (!dj) {
      dj = await StreamDJ.create({
        channelId,
        queue: [],
        playedTracks: []
      });
    }
    
    res.json({ success: true, dj });
  } catch (error) {
    console.error('Init DJ error:', error);
    res.status(500).json({ error: 'Failed to initialize DJ' });
  }
});

// Get DJ state for a channel
router.get('/:channelId', async (req, res) => {
  try {
    const dj = await StreamDJ.findOne({ channelId: req.params.channelId });
    
    if (!dj) {
      return res.status(404).json({ error: 'DJ not found' });
    }
    
    res.json({ success: true, dj });
  } catch (error) {
    console.error('Get DJ error:', error);
    res.status(500).json({ error: 'Failed to get DJ state' });
  }
});

// Add track to queue
router.post('/:channelId/queue', verifyToken, async (req, res) => {
  try {
    const { title, artist, url } = req.body;
    const dj = await StreamDJ.findOne({ channelId: req.params.channelId });
    
    if (!dj) {
      return res.status(404).json({ error: 'DJ not found' });
    }
    
    if (!dj.settings.allowViewerRequests) {
      return res.status(403).json({ error: 'Viewer requests are disabled' });
    }
    
    if (dj.queue.length >= dj.settings.maxQueueSize) {
      return res.status(400).json({ error: 'Queue is full' });
    }
    
    const track = {
      title,
      artist,
      url,
      addedBy: req.user.id,
      addedByUsername: req.user.username,
      votes: 0,
      voters: []
    };
    
    dj.queue.push(track);
    await dj.save();
    
    res.json({ success: true, dj });
  } catch (error) {
    console.error('Add track error:', error);
    res.status(500).json({ error: 'Failed to add track' });
  }
});

// Vote for a track
router.post('/:channelId/vote/:trackIndex', verifyToken, async (req, res) => {
  try {
    const { channelId, trackIndex } = req.params;
    const dj = await StreamDJ.findOne({ channelId });
    
    if (!dj) {
      return res.status(404).json({ error: 'DJ not found' });
    }
    
    if (!dj.settings.votingEnabled) {
      return res.status(403).json({ error: 'Voting is disabled' });
    }
    
    const track = dj.queue[trackIndex];
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    
    // Check if user already voted
    if (track.voters.includes(req.user.id)) {
      // Remove vote
      track.voters = track.voters.filter(id => id !== req.user.id);
      track.votes -= 1;
    } else {
      // Add vote
      track.voters.push(req.user.id);
      track.votes += 1;
    }
    
    // Sort queue by votes
    dj.queue.sort((a, b) => b.votes - a.votes);
    
    await dj.save();
    
    res.json({ success: true, dj });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// Play next track
router.post('/:channelId/next', verifyToken, async (req, res) => {
  try {
    const dj = await StreamDJ.findOne({ channelId: req.params.channelId });
    
    if (!dj) {
      return res.status(404).json({ error: 'DJ not found' });
    }
    
    if (dj.queue.length === 0) {
      return res.status(400).json({ error: 'Queue is empty' });
    }
    
    // Move current track to played
    if (dj.currentTrack) {
      dj.playedTracks.push({
        ...dj.currentTrack,
        playedAt: new Date()
      });
    }
    
    // Get next track (highest votes)
    const nextTrack = dj.queue.shift();
    dj.currentTrack = nextTrack;
    
    await dj.save();
    
    res.json({ success: true, dj });
  } catch (error) {
    console.error('Next track error:', error);
    res.status(500).json({ error: 'Failed to play next track' });
  }
});

// Skip current track
router.post('/:channelId/skip', verifyToken, async (req, res) => {
  try {
    const dj = await StreamDJ.findOne({ channelId: req.params.channelId });
    
    if (!dj) {
      return res.status(404).json({ error: 'DJ not found' });
    }
    
    if (dj.currentTrack) {
      dj.playedTracks.push({
        ...dj.currentTrack,
        playedAt: new Date()
      });
    }
    
    if (dj.queue.length > 0) {
      const nextTrack = dj.queue.shift();
      dj.currentTrack = nextTrack;
    } else {
      dj.currentTrack = null;
    }
    
    await dj.save();
    
    res.json({ success: true, dj });
  } catch (error) {
    console.error('Skip track error:', error);
    res.status(500).json({ error: 'Failed to skip track' });
  }
});

// Remove track from queue
router.delete('/:channelId/queue/:trackIndex', verifyToken, async (req, res) => {
  try {
    const { channelId, trackIndex } = req.params;
    const dj = await StreamDJ.findOne({ channelId });
    
    if (!dj) {
      return res.status(404).json({ error: 'DJ not found' });
    }
    
    if (trackIndex < 0 || trackIndex >= dj.queue.length) {
      return res.status(404).json({ error: 'Track not found' });
    }
    
    dj.queue.splice(trackIndex, 1);
    await dj.save();
    
    res.json({ success: true, dj });
  } catch (error) {
    console.error('Remove track error:', error);
    res.status(500).json({ error: 'Failed to remove track' });
  }
});

// Update DJ settings
router.put('/:channelId/settings', verifyToken, async (req, res) => {
  try {
    const dj = await StreamDJ.findOne({ channelId: req.params.channelId });
    
    if (!dj) {
      return res.status(404).json({ error: 'DJ not found' });
    }
    
    const { allowViewerRequests, maxQueueSize, votingEnabled, autoPlay } = req.body;
    
    if (allowViewerRequests !== undefined) dj.settings.allowViewerRequests = allowViewerRequests;
    if (maxQueueSize !== undefined) dj.settings.maxQueueSize = maxQueueSize;
    if (votingEnabled !== undefined) dj.settings.votingEnabled = votingEnabled;
    if (autoPlay !== undefined) dj.settings.autoPlay = autoPlay;
    
    await dj.save();
    
    res.json({ success: true, dj });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Clear queue
router.delete('/:channelId/queue', verifyToken, async (req, res) => {
  try {
    const dj = await StreamDJ.findOne({ channelId: req.params.channelId });
    
    if (!dj) {
      return res.status(404).json({ error: 'DJ not found' });
    }
    
    dj.queue = [];
    await dj.save();
    
    res.json({ success: true, dj });
  } catch (error) {
    console.error('Clear queue error:', error);
    res.status(500).json({ error: 'Failed to clear queue' });
  }
});

export default router;
