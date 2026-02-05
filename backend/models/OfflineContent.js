import mongoose from 'mongoose';

const offlineContentSchema = new mongoose.Schema({
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
  downloadedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  fileSize: {
    type: Number,
    default: 0 // in MB
  },
  quality: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['downloading', 'ready', 'expired'],
    default: 'ready'
  }
});

// Index for faster queries
offlineContentSchema.index({ userId: 1, downloadedAt: -1 });
offlineContentSchema.index({ expiresAt: 1 });

export default mongoose.model('OfflineContent', offlineContentSchema);
