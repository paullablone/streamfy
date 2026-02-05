import mongoose from 'mongoose';

const userStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Streaming Stats
  totalStreams: { type: Number, default: 0 },
  totalStreamTime: { type: Number, default: 0 }, // in minutes
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastStreamDate: Date,
  
  // Viewing Stats
  totalWatchTime: { type: Number, default: 0 }, // in minutes
  streamsWatched: { type: Number, default: 0 },
  viewingStreak: { type: Number, default: 0 },
  longestViewingStreak: { type: Number, default: 0 },
  lastViewDate: Date,
  
  // Engagement Stats
  messagesCount: { type: Number, default: 0 },
  reactionsCount: { type: Number, default: 0 },
  donationsGiven: { type: Number, default: 0 },
  donationsReceived: { type: Number, default: 0 },
  sponsorshipsGiven: { type: Number, default: 0 },
  sponsorshipsReceived: { type: Number, default: 0 },
  
  // Social Stats
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  channelViews: { type: Number, default: 0 },
  
  // Points & Level
  experiencePoints: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  
  // Badges
  badges: [{
    badgeId: String,
    earnedAt: { type: Date, default: Date.now },
    progress: Number
  }],
  
  // Achievements
  achievements: [{
    achievementId: String,
    unlockedAt: { type: Date, default: Date.now },
    tier: String
  }],
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
userStatsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate level from XP
userStatsSchema.methods.calculateLevel = function() {
  // Level formula: level = floor(sqrt(XP / 100))
  this.level = Math.floor(Math.sqrt(this.experiencePoints / 100)) + 1;
  return this.level;
};

// Add XP and check for level up
userStatsSchema.methods.addExperience = function(xp) {
  const oldLevel = this.level;
  this.experiencePoints += xp;
  this.calculateLevel();
  return this.level > oldLevel; // Returns true if leveled up
};

export default mongoose.model('UserStats', userStatsSchema);
