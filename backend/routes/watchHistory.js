import express from 'express';
import WatchHistory from '../models/WatchHistory.js';
import { verifyToken } from '../auth.js';

const router = express.Router();

// Get user's watch history
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    
    const history = await WatchHistory.find({ userId })
      .sort({ watchedAt: -1 })
      .limit(limit);
    
    res.json({ success: true, history });
  } catch (error) {
    console.error('Get watch history error:', error);
    res.status(500).json({ error: 'Failed to fetch watch history' });
  }
});

// Add to watch history
router.post('/add', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { channelId, channelName, channelIcon, channelCategory, videoUrl, thumbnail, duration } = req.body;
    
    // Check if already watched recently (within last 5 minutes)
    const recentWatch = await WatchHistory.findOne({
      userId,
      channelId,
      watchedAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    });
    
    if (recentWatch) {
      // Update duration instead of creating new entry
      recentWatch.duration += duration || 0;
      recentWatch.watchedAt = new Date();
      await recentWatch.save();
      return res.json({ success: true, history: recentWatch });
    }
    
    // Create new watch history entry
    const history = await WatchHistory.create({
      userId,
      channelId,
      channelName,
      channelIcon,
      channelCategory,
      videoUrl,
      thumbnail,
      duration: duration || 0
    });
    
    res.json({ success: true, history });
  } catch (error) {
    console.error('Add watch history error:', error);
    res.status(500).json({ error: 'Failed to add to watch history' });
  }
});

// Clear watch history
router.delete('/clear', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await WatchHistory.deleteMany({ userId });
    res.json({ success: true, message: 'Watch history cleared' });
  } catch (error) {
    console.error('Clear watch history error:', error);
    res.status(500).json({ error: 'Failed to clear watch history' });
  }
});

// Delete specific history item
router.delete('/:historyId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { historyId } = req.params;
    
    await WatchHistory.findOneAndDelete({ _id: historyId, userId });
    res.json({ success: true, message: 'History item deleted' });
  } catch (error) {
    console.error('Delete history item error:', error);
    res.status(500).json({ error: 'Failed to delete history item' });
  }
});

export default router;
