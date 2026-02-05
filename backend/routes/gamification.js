import express from 'express';
import UserStats from '../models/UserStats.js';
import Badge from '../models/Badge.js';
import User from '../models/User.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// Initialize badges (run once)
const initializeBadges = async () => {
  const badges = [
    // Streaming Badges
    { badgeId: 'first-stream', name: 'First Stream', description: 'Started your first stream', icon: '🎬', color: '#667eea', category: 'streaming', rarity: 'common', requirement: 'totalStreams', requiredValue: 1, xpReward: 50 },
    { badgeId: 'stream-10', name: 'Rising Star', description: 'Completed 10 streams', icon: '⭐', color: '#fbbf24', category: 'streaming', rarity: 'common', requirement: 'totalStreams', requiredValue: 10, xpReward: 100 },
    { badgeId: 'stream-50', name: 'Content Creator', description: 'Completed 50 streams', icon: '🎥', color: '#f093fb', category: 'streaming', rarity: 'rare', requirement: 'totalStreams', requiredValue: 50, xpReward: 250 },
    { badgeId: 'stream-100', name: 'Streaming Legend', description: 'Completed 100 streams', icon: '👑', color: '#ffd700', category: 'streaming', rarity: 'epic', requirement: 'totalStreams', requiredValue: 100, xpReward: 500 },
    
    // Streak Badges
    { badgeId: 'streak-7', name: '7 Day Streak', description: 'Streamed for 7 days in a row', icon: '🔥', color: '#ef4444', category: 'streaming', rarity: 'rare', requirement: 'currentStreak', requiredValue: 7, xpReward: 200 },
    { badgeId: 'streak-30', name: '30 Day Streak', description: 'Streamed for 30 days in a row', icon: '💪', color: '#10b981', category: 'streaming', rarity: 'epic', requirement: 'currentStreak', requiredValue: 30, xpReward: 500 },
    { badgeId: 'streak-100', name: '100 Day Streak', description: 'Streamed for 100 days in a row', icon: '🏆', color: '#a78bfa', category: 'streaming', rarity: 'legendary', requirement: 'currentStreak', requiredValue: 100, xpReward: 1000 },
    
    // Viewing Badges
    { badgeId: 'first-watch', name: 'First Watch', description: 'Watched your first stream', icon: '👀', color: '#4facfe', category: 'viewing', rarity: 'common', requirement: 'streamsWatched', requiredValue: 1, xpReward: 25 },
    { badgeId: 'binge-watcher', name: 'Binge Watcher', description: 'Watched 50 streams', icon: '📺', color: '#fb923c', category: 'viewing', rarity: 'rare', requirement: 'streamsWatched', requiredValue: 50, xpReward: 150 },
    { badgeId: 'super-fan', name: 'Super Fan', description: 'Watched 100 streams', icon: '💖', color: '#ec4899', category: 'viewing', rarity: 'epic', requirement: 'streamsWatched', requiredValue: 100, xpReward: 300 },
    
    // Social Badges
    { badgeId: 'social-10', name: 'Social Butterfly', description: 'Got 10 followers', icon: '🦋', color: '#a78bfa', category: 'social', rarity: 'common', requirement: 'followers', requiredValue: 10, xpReward: 100 },
    { badgeId: 'social-100', name: 'Influencer', description: 'Got 100 followers', icon: '🌟', color: '#fbbf24', category: 'social', rarity: 'rare', requirement: 'followers', requiredValue: 100, xpReward: 250 },
    { badgeId: 'social-1000', name: 'Celebrity', description: 'Got 1000 followers', icon: '💫', color: '#ffd700', category: 'social', rarity: 'epic', requirement: 'followers', requiredValue: 1000, xpReward: 500 },
    
    // Engagement Badges
    { badgeId: 'chatty', name: 'Chatty', description: 'Sent 100 messages', icon: '💬', color: '#667eea', category: 'engagement', rarity: 'common', requirement: 'messagesCount', requiredValue: 100, xpReward: 50 },
    { badgeId: 'generous', name: 'Generous', description: 'Made 5 donations', icon: '💰', color: '#10b981', category: 'engagement', rarity: 'rare', requirement: 'donationsGiven', requiredValue: 5, xpReward: 200 },
    { badgeId: 'sponsor', name: 'Sponsor', description: 'Sponsored a streamer', icon: '🤝', color: '#f093fb', category: 'engagement', rarity: 'epic', requirement: 'sponsorshipsGiven', requiredValue: 1, xpReward: 300 },
    
    // Special Badges
    { badgeId: 'early-adopter', name: 'Early Adopter', description: 'Joined Streamfy early', icon: '🚀', color: '#667eea', category: 'special', rarity: 'legendary', requirement: 'special', requiredValue: 1, xpReward: 500 },
    { badgeId: 'verified', name: 'Verified', description: 'Verified account', icon: '✓', color: '#10b981', category: 'special', rarity: 'rare', requirement: 'special', requiredValue: 1, xpReward: 100 }
  ];
  
  for (const badge of badges) {
    await Badge.findOneAndUpdate(
      { badgeId: badge.badgeId },
      badge,
      { upsert: true, new: true }
    );
  }
};

// Initialize badges on server start
initializeBadges().catch(console.error);

// Get user stats
router.get('/stats/:userId?', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    let stats = await UserStats.findOne({ userId });
    
    if (!stats) {
      stats = new UserStats({ userId });
      await stats.save();
    }
    
    const user = await User.findById(userId);
    
    res.json({
      success: true,
      stats: {
        ...stats.toObject(),
        username: user?.username
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Update stats (internal use)
router.post('/stats/update', authenticateToken, async (req, res) => {
  try {
    const { action, value } = req.body;
    const userId = req.user.id;
    
    let stats = await UserStats.findOne({ userId });
    if (!stats) {
      stats = new UserStats({ userId });
    }
    
    // Update based on action
    switch (action) {
      case 'stream_start':
        stats.totalStreams += 1;
        stats.lastStreamDate = new Date();
        stats.addExperience(10);
        break;
      case 'stream_end':
        stats.totalStreamTime += value || 0;
        stats.addExperience(value || 0);
        break;
      case 'watch_stream':
        stats.streamsWatched += 1;
        stats.lastViewDate = new Date();
        stats.addExperience(5);
        break;
      case 'watch_time':
        stats.totalWatchTime += value || 0;
        stats.addExperience(Math.floor((value || 0) / 10));
        break;
      case 'send_message':
        stats.messagesCount += 1;
        stats.addExperience(1);
        break;
      case 'send_reaction':
        stats.reactionsCount += 1;
        stats.addExperience(1);
        break;
      case 'donate':
        stats.donationsGiven += 1;
        stats.addExperience(50);
        break;
      case 'receive_donation':
        stats.donationsReceived += 1;
        stats.addExperience(25);
        break;
      case 'sponsor':
        stats.sponsorshipsGiven += 1;
        stats.addExperience(100);
        break;
      case 'receive_sponsorship':
        stats.sponsorshipsReceived += 1;
        stats.addExperience(75);
        break;
    }
    
    await stats.save();
    
    // Check for new badges
    await checkBadges(userId, stats);
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

// Check and award badges
async function checkBadges(userId, stats) {
  const allBadges = await Badge.find({ isActive: true });
  const userBadgeIds = stats.badges.map(b => b.badgeId);
  
  for (const badge of allBadges) {
    if (userBadgeIds.includes(badge.badgeId)) continue;
    
    let earned = false;
    
    if (badge.requirement !== 'special') {
      const currentValue = stats[badge.requirement] || 0;
      earned = currentValue >= badge.requiredValue;
    }
    
    if (earned) {
      stats.badges.push({
        badgeId: badge.badgeId,
        earnedAt: new Date()
      });
      stats.addExperience(badge.xpReward);
      await stats.save();
    }
  }
}

// Get all badges
router.get('/badges', async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true }).sort({ rarity: 1, requiredValue: 1 });
    res.json({ success: true, badges });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Get user badges
router.get('/my-badges', authenticateToken, async (req, res) => {
  try {
    const stats = await UserStats.findOne({ userId: req.user.id });
    
    if (!stats) {
      return res.json({ success: true, badges: [] });
    }
    
    const badgeIds = stats.badges.map(b => b.badgeId);
    const badges = await Badge.find({ badgeId: { $in: badgeIds } });
    
    const userBadges = stats.badges.map(ub => {
      const badge = badges.find(b => b.badgeId === ub.badgeId);
      return {
        ...badge?.toObject(),
        earnedAt: ub.earnedAt
      };
    });
    
    res.json({ success: true, badges: userBadges });
  } catch (error) {
    console.error('Get user badges error:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Leaderboards
router.get('/leaderboard/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    let sortField = 'experiencePoints';
    
    switch (type) {
      case 'xp':
        sortField = 'experiencePoints';
        break;
      case 'level':
        sortField = 'level';
        break;
      case 'streams':
        sortField = 'totalStreams';
        break;
      case 'watch-time':
        sortField = 'totalWatchTime';
        break;
      case 'streak':
        sortField = 'currentStreak';
        break;
      case 'followers':
        sortField = 'followers';
        break;
      case 'donations':
        sortField = 'donationsReceived';
        break;
    }
    
    const stats = await UserStats.find()
      .sort({ [sortField]: -1 })
      .limit(limit)
      .populate('userId', 'username email');
    
    const leaderboard = stats.map((stat, index) => ({
      rank: index + 1,
      userId: stat.userId._id,
      username: stat.userId.username,
      value: stat[sortField],
      level: stat.level,
      xp: stat.experiencePoints,
      badges: stat.badges.length
    }));
    
    res.json({ success: true, leaderboard, type });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get user rank
router.get('/rank/:type?', authenticateToken, async (req, res) => {
  try {
    const type = req.params.type || 'xp';
    const userId = req.user.id;
    
    let sortField = 'experiencePoints';
    switch (type) {
      case 'xp': sortField = 'experiencePoints'; break;
      case 'level': sortField = 'level'; break;
      case 'streams': sortField = 'totalStreams'; break;
      case 'watch-time': sortField = 'totalWatchTime'; break;
      case 'streak': sortField = 'currentStreak'; break;
      case 'followers': sortField = 'followers'; break;
    }
    
    const userStats = await UserStats.findOne({ userId });
    if (!userStats) {
      return res.json({ success: true, rank: null });
    }
    
    const rank = await UserStats.countDocuments({
      [sortField]: { $gt: userStats[sortField] }
    }) + 1;
    
    const total = await UserStats.countDocuments();
    
    res.json({
      success: true,
      rank,
      total,
      percentile: Math.round((1 - rank / total) * 100)
    });
  } catch (error) {
    console.error('Get rank error:', error);
    res.status(500).json({ error: 'Failed to fetch rank' });
  }
});

export default router;
