import mongoose from 'mongoose';

const streamMatchSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  interests: [{
    type: String
  }],
  favoriteCategories: [{
    type: String
  }],
  watchHistory: [{
    category: String,
    count: Number
  }],
  matches: [{
    userId: String,
    username: String,
    matchScore: Number,
    commonInterests: [String]
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('StreamMatch', streamMatchSchema);
