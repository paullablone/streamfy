import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// YouTube category IDs
const CATEGORY_IDS = {
  gaming: '20',
  music: '10',
  sports: '17',
  entertainment: '24',
  education: '27',
  tech: '28',
  lifestyle: '22',
  travel: '19',
  comedy: '23',
  news: '25'
};

/**
 * Fetch live streams by category
 * @param {string} category - Category name (gaming, music, etc.)
 * @param {number} maxResults - Number of results to fetch (default: 10)
 * @returns {Promise<Array>} Array of video objects
 */
async function fetchLiveStreamsByCategory(category, maxResults = 10) {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    const categoryId = CATEGORY_IDS[category.toLowerCase()];
    if (!categoryId) {
      throw new Error(`Invalid category: ${category}`);
    }

    // Search for live streams in the category
    const searchResponse = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        type: 'video',
        eventType: 'live',
        videoCategoryId: categoryId,
        maxResults: maxResults,
        order: 'viewCount',
        key: YOUTUBE_API_KEY
      }
    });

    const videos = searchResponse.data.items || [];
    
    if (videos.length === 0) {
      console.log(`No live streams found for category: ${category}`);
      return [];
    }

    // Get video IDs
    const videoIds = videos.map(video => video.id.videoId).join(',');

    // Fetch detailed video information including live viewer count
    const videoResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'snippet,liveStreamingDetails,statistics',
        id: videoIds,
        key: YOUTUBE_API_KEY
      }
    });

    const detailedVideos = videoResponse.data.items || [];

    // Format the response
    return detailedVideos.map(video => ({
      id: video.id,
      videoId: video.id,
      title: video.snippet.title,
      name: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.medium.url,
      channelTitle: video.snippet.channelTitle,
      channelId: video.snippet.channelId,
      streamer: video.snippet.channelTitle,
      viewers: parseInt(video.liveStreamingDetails?.concurrentViewers || 0),
      viewCount: parseInt(video.statistics?.viewCount || 0),
      likeCount: parseInt(video.statistics?.likeCount || 0),
      category: category,
      publishedAt: video.snippet.publishedAt,
      videoUrl: `https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&loop=1&playlist=${video.id}`
    }));

  } catch (error) {
    console.error(`Error fetching YouTube videos for ${category}:`, error.message);
    
    // Check if it's a quota error
    if (error.response?.status === 403) {
      throw new Error('YouTube API quota exceeded. Please try again later.');
    }
    
    throw error;
  }
}

/**
 * Fetch videos by search query
 * @param {string} query - Search query
 * @param {number} maxResults - Number of results
 * @returns {Promise<Array>} Array of video objects
 */
async function searchVideos(query, maxResults = 10) {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    const searchResponse = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        part: 'snippet',
        type: 'video',
        eventType: 'live',
        q: query,
        maxResults: maxResults,
        order: 'viewCount',
        key: YOUTUBE_API_KEY
      }
    });

    const videos = searchResponse.data.items || [];
    
    if (videos.length === 0) {
      return [];
    }

    const videoIds = videos.map(video => video.id.videoId).join(',');

    const videoResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'snippet,liveStreamingDetails,statistics',
        id: videoIds,
        key: YOUTUBE_API_KEY
      }
    });

    const detailedVideos = videoResponse.data.items || [];

    return detailedVideos.map(video => ({
      id: video.id,
      videoId: video.id,
      title: video.snippet.title,
      name: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.medium.url,
      channelTitle: video.snippet.channelTitle,
      streamer: video.snippet.channelTitle,
      viewers: parseInt(video.liveStreamingDetails?.concurrentViewers || 0),
      viewCount: parseInt(video.statistics?.viewCount || 0),
      videoUrl: `https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&loop=1&playlist=${video.id}`
    }));

  } catch (error) {
    console.error('Error searching YouTube videos:', error.message);
    throw error;
  }
}

/**
 * Fetch trending videos (not necessarily live)
 * @param {string} regionCode - Region code (US, GB, etc.)
 * @param {number} maxResults - Number of results
 * @returns {Promise<Array>} Array of video objects
 */
async function fetchTrendingVideos(regionCode = 'US', maxResults = 10) {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'snippet,statistics',
        chart: 'mostPopular',
        regionCode: regionCode,
        maxResults: maxResults,
        key: YOUTUBE_API_KEY
      }
    });

    const videos = response.data.items || [];

    return videos.map(video => ({
      id: video.id,
      videoId: video.id,
      title: video.snippet.title,
      name: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.medium.url,
      channelTitle: video.snippet.channelTitle,
      streamer: video.snippet.channelTitle,
      viewCount: parseInt(video.statistics?.viewCount || 0),
      likeCount: parseInt(video.statistics?.likeCount || 0),
      videoUrl: `https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&loop=1&playlist=${video.id}`
    }));

  } catch (error) {
    console.error('Error fetching trending videos:', error.message);
    throw error;
  }
}

export {
  fetchLiveStreamsByCategory,
  searchVideos,
  fetchTrendingVideos,
  CATEGORY_IDS
};
