import express from 'express';
import recommendationService from '../services/recommendationService.js';
import { verifyToken } from '../auth.js';

const router = express.Router();

// Get AI-powered recommendations
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    const recommendations = await recommendationService.getRecommendations(userId, limit);
    
    res.json({ 
      success: true, 
      recommendations,
      message: 'AI-powered recommendations based on your watch history'
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Get recommendations for guest users
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const recommendations = recommendationService.getTrendingContent(limit);
    
    res.json({ 
      success: true, 
      recommendations,
      message: 'Trending content'
    });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to fetch trending content' });
  }
});

export default router;
