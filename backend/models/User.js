import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'streamer', 'admin'],
    default: 'user'
  },
  profile: {
    avatar: String,
    bio: String,
    location: String,
    socialLinks: {
      twitter: String,
      instagram: String,
      youtube: String
    }
  },
  stats: {
    totalWatchTime: { type: Number, default: 0 },
    totalStreams: { type: Number, default: 0 },
    totalGiftsSent: { type: Number, default: 0 },
    totalGiftsReceived: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 }
  },
  achievements: [{
    challengeId: String,
    title: String,
    completedAt: Date,
    reward: Number
  }],
  progress: {
    type: Map,
    of: Number,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('User', userSchema);
