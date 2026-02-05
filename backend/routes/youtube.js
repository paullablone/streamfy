import express from 'express';
import * as youtubeService from '../services/youtubeService.js';

const router = express.Router();

/**
 * GET /api/youtube/category/:category
 * Fetch live streams by category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const maxResults = parseInt(req.query.maxResults) || 10;

    const videos = await youtubeService.fetchLiveStreamsByCategory(category, maxResults);

    res.json({
      success: true,
      category: category,
      count: videos.length,
      videos: videos
    });

  } catch (error) {
    console.error('Error fetching category videos:', error);
    
    res.status(error.message.includes('quota') ? 429 : 500).json({
      success: false,
      error: error.message,
      category: req.params.category
    });
  }
});

/**
 * GET /api/youtube/search
 * Search for live streams
 */
router.get('/search', async (req, res) => {
  try {
    const { q, maxResults = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }

    const videos = await youtubeService.searchVideos(q, parseInt(maxResults));

    res.json({
      success: true,
      query: q,
      count: videos.length,
      videos: videos
    });

  } catch (error) {
    console.error('Error searching videos:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/youtube/trending
 * Fetch trending videos
 */
router.get('/trending', async (req, res) => {
  try {
    const { region = 'US', maxResults = 10 } = req.query;

    const videos = await youtubeService.fetchTrendingVideos(region, parseInt(maxResults));

    res.json({
      success: true,
      region: region,
      count: videos.length,
      videos: videos
    });

  } catch (error) {
    console.error('Error fetching trending videos:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/youtube/categories
 * Get all available categories
 */
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: Object.keys(youtubeService.CATEGORY_IDS)
  });
});

/**
 * GET /api/youtube/bulk
 * Fetch videos for multiple categories at once
 */
router.get('/bulk', async (req, res) => {
  try {
    const categories = req.query.categories?.split(',') || ['gaming', 'music', 'sports'];
    const maxResults = parseInt(req.query.maxResults) || 5;

    const results = {};
    
    // Fetch videos for each category
    for (const category of categories) {
      try {
        const videos = await youtubeService.fetchLiveStreamsByCategory(category, maxResults);
        results[category] = videos;
      } catch (error) {
        console.error(`Error fetching ${category}:`, error.message);
        results[category] = [];
      }
    }

    res.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('Error in bulk fetch:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
