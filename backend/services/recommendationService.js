import WatchHistory from '../models/WatchHistory.js';
import Channel from '../models/Channel.js';

class RecommendationService {
  // Get AI-powered recommendations based on watch history
  async getRecommendations(userId, limit = 10) {
    try {
      // Get user's watch history
      const history = await WatchHistory.find({ userId })
        .sort({ watchedAt: -1 })
        .limit(50);

      if (history.length === 0) {
        // New user - return trending/popular content
        return this.getTrendingContent(limit);
      }

      // Analyze watch patterns
      const categoryScores = this.analyzeCategoryPreferences(history);
      const timePatterns = this.analyzeWatchTimePatterns(history);
      const channelPreferences = this.analyzeChannelPreferences(history);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        categoryScores,
        channelPreferences,
        timePatterns,
        limit
      );

      return recommendations;
    } catch (error) {
      console.error('Recommendation error:', error);
      return this.getTrendingContent(limit);
    }
  }

  // Analyze category preferences
  analyzeCategoryPreferences(history) {
    const categoryCount = {};
    const categoryDuration = {};

    history.forEach(item => {
      const category = item.channelCategory || 'General';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      categoryDuration[category] = (categoryDuration[category] || 0) + (item.duration || 0);
    });

    // Calculate scores (weighted by count and duration)
    const scores = {};
    Object.keys(categoryCount).forEach(category => {
      const countScore = categoryCount[category] / history.length;
      const durationScore = categoryDuration[category] / 
        Object.values(categoryDuration).reduce((a, b) => a + b, 1);
      scores[category] = (countScore * 0.4 + durationScore * 0.6) * 100;
    });

    return scores;
  }

  // Analyze watch time patterns
  analyzeWatchTimePatterns(history) {
    const hourCounts = new Array(24).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);

    history.forEach(item => {
      const date = new Date(item.watchedAt);
      hourCounts[date.getHours()]++;
      dayOfWeekCounts[date.getDay()]++;
    });

    return {
      preferredHours: hourCounts,
      preferredDays: dayOfWeekCounts,
      currentHour: new Date().getHours(),
      currentDay: new Date().getDay()
    };
  }

  // Analyze channel preferences
  analyzeChannelPreferences(history) {
    const channelScores = {};

    history.forEach((item, index) => {
      const channelId = item.channelId;
      const recencyScore = (history.length - index) / history.length;
      const durationScore = Math.min(item.duration / 3600, 1); // Cap at 1 hour
      
      if (!channelScores[channelId]) {
        channelScores[channelId] = {
          name: item.channelName,
          category: item.channelCategory,
          score: 0,
          count: 0
        };
      }

      channelScores[channelId].score += (recencyScore * 0.5 + durationScore * 0.5);
      channelScores[channelId].count++;
    });

    return channelScores;
  }

  // Generate recommendations based on analysis
  async generateRecommendations(categoryScores, channelPreferences, timePatterns, limit) {
    // Get top categories
    const topCategories = Object.entries(categoryScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    // Mock recommendation data (in production, this would query actual channels)
    const recommendations = this.getMockRecommendations(topCategories, limit);

    // Score and sort recommendations
    return recommendations
      .map(rec => ({
        ...rec,
        score: this.calculateRecommendationScore(rec, categoryScores, channelPreferences),
        reason: this.getRecommendationReason(rec, categoryScores, channelPreferences)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Calculate recommendation score
  calculateRecommendationScore(recommendation, categoryScores, channelPreferences) {
    let score = 0;

    // Category match
    const categoryScore = categoryScores[recommendation.category] || 0;
    score += categoryScore * 0.4;

    // Similar channel bonus
    if (channelPreferences[recommendation.id]) {
      score += channelPreferences[recommendation.id].score * 30;
    }

    // Popularity bonus
    score += Math.log10(recommendation.viewers + 1) * 5;

    // Freshness bonus (for new content)
    score += Math.random() * 10; // Add some randomness

    return score;
  }

  // Get recommendation reason
  getRecommendationReason(recommendation, categoryScores, channelPreferences) {
    const reasons = [];

    if (categoryScores[recommendation.category] > 20) {
      reasons.push(`You watch a lot of ${recommendation.category}`);
    }

    if (channelPreferences[recommendation.id]) {
      reasons.push('You watched this before');
    }

    if (recommendation.viewers > 10000) {
      reasons.push('Trending now');
    }

    if (reasons.length === 0) {
      reasons.push('Recommended for you');
    }

    return reasons[0];
  }

  // Get trending content for new users
  getTrendingContent(limit) {
    return this.getMockRecommendations(['Gaming', 'Music', 'Entertainment'], limit)
      .map(rec => ({
        ...rec,
        score: rec.viewers,
        reason: 'Trending now'
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Mock recommendations (replace with actual database queries)
  getMockRecommendations(categories, limit) {
    const allRecommendations = [
      {
        id: 'rec-gaming-1',
        name: 'Epic Gaming Marathon',
        category: 'Gaming',
        icon: '🎮',
        viewers: 15234,
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1',
        description: 'Non-stop gaming action',
        isLive: true
      },
      {
        id: 'rec-music-1',
        name: 'Chill Beats Radio',
        category: 'Music',
        icon: '🎵',
        viewers: 28901,
        thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/mqdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1',
        description: 'Relaxing music 24/7',
        isLive: true
      },
      {
        id: 'rec-tech-1',
        name: 'Coding Live',
        category: 'Technology',
        icon: '💻',
        viewers: 8765,
        thumbnail: 'https://img.youtube.com/vi/rfscVS0vtbw/mqdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/rfscVS0vtbw?autoplay=1&mute=1',
        description: 'Live coding session',
        isLive: true
      },
      {
        id: 'rec-sports-1',
        name: 'Sports Highlights',
        category: 'Sports',
        icon: '⚽',
        viewers: 19876,
        thumbnail: 'https://img.youtube.com/vi/EngW7tLk6R8/mqdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/EngW7tLk6R8?autoplay=1&mute=1',
        description: 'Best sports moments',
        isLive: true
      },
      {
        id: 'rec-entertainment-1',
        name: 'Comedy Central',
        category: 'Entertainment',
        icon: '🎬',
        viewers: 12345,
        thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/9bZkp7q19f0?autoplay=1&mute=1',
        description: 'Funny videos compilation',
        isLive: true
      },
      {
        id: 'rec-gaming-2',
        name: 'Esports Tournament',
        category: 'Gaming',
        icon: '🎮',
        viewers: 34567,
        thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=1&mute=1',
        description: 'Professional gaming',
        isLive: true
      },
      {
        id: 'rec-music-2',
        name: 'Live Concert',
        category: 'Music',
        icon: '🎵',
        viewers: 21098,
        thumbnail: 'https://img.youtube.com/vi/60ItHLz5WEA/mqdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/60ItHLz5WEA?autoplay=1&mute=1',
        description: 'Live music performance',
        isLive: true
      },
      {
        id: 'rec-lifestyle-1',
        name: 'Cooking Show',
        category: 'Lifestyle',
        icon: '🍳',
        viewers: 9876,
        thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg',
        videoUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk?autoplay=1&mute=1',
        description: 'Learn to cook',
        isLive: true
      }
    ];

    // Filter by preferred categories if specified
    if (categories && categories.length > 0) {
      return allRecommendations.filter(rec => 
        categories.includes(rec.category)
      ).concat(
        allRecommendations.filter(rec => 
          !categories.includes(rec.category)
        )
      );
    }

    return allRecommendations;
  }
}

export default new RecommendationService();
