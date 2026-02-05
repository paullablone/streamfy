import express from 'express';
import OfflineContent from '../models/OfflineContent.js';
import { verifyToken } from '../auth.js';

const router = express.Router();

// Get user's offline content
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Remove expired content
    await OfflineContent.deleteMany({
      userId,
      expiresAt: { $lt: new Date() }
    });
    
    const content = await OfflineContent.find({ 
      userId,
      status: { $ne: 'expired' }
    }).sort({ downloadedAt: -1 });
    
    res.json({ success: true, content });
  } catch (error) {
    console.error('Get offline content error:', error);
    res.status(500).json({ error: 'Failed to fetch offline content' });
  }
});

// Save content for offline viewing
router.post('/save', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { channelId, channelName, channelIcon, channelCategory, videoUrl, thumbnail, quality } = req.body;
    
    // Check if already saved
    const existing = await OfflineContent.findOne({ userId, channelId });
    if (existing) {
      return res.json({ 
        success: true, 
        content: existing,
        message: 'Already saved for offline viewing'
      });
    }
    
    // Estimate file size based on quality
    const fileSizes = { low: 50, medium: 150, high: 300 };
    const fileSize = fileSizes[quality] || 150;
    
    // Create offline content entry
    const content = await OfflineContent.create({
      userId,
      channelId,
      channelName,
      channelIcon,
      channelCategory,
      videoUrl,
      thumbnail,
      quality,
      fileSize,
      status: 'ready'
    });
    
    res.json({ 
      success: true, 
      content,
      message: 'Saved for offline viewing'
    });
  } catch (error) {
    console.error('Save offline content error:', error);
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// Delete offline content
router.delete('/:contentId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentId } = req.params;
    
    await OfflineContent.findOneAndDelete({ _id: contentId, userId });
    res.json({ success: true, message: 'Offline content deleted' });
  } catch (error) {
    console.error('Delete offline content error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// Clear all offline content
router.delete('/clear/all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await OfflineContent.deleteMany({ userId });
    res.json({ success: true, message: 'All offline content cleared' });
  } catch (error) {
    console.error('Clear offline content error:', error);
    res.status(500).json({ error: 'Failed to clear content' });
  }
});

export default router;
