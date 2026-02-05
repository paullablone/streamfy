import mongoose from 'mongoose';

const watchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channelId: {
    type: String,
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  channelIcon: String,
  channelCategory: String,
  videoUrl: String,
  thumbnail: String,
  watchedAt: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number,
    default: 0 // in seconds
  }
});

// Index for faster queries
watchHistorySchema.index({ userId: 1, watchedAt: -1 });

export default mongoose.model('WatchHistory', watchHistorySchema);
