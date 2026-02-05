import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'user_signup',
      'user_login',
      'channel_created',
      'stream_started',
      'stream_ended',
      'gift_sent',
      'poll_created',
      'poll_voted',
      'watch_party_created',
      'watch_party_joined',
      'challenge_completed',
      'content_uploaded',
      'subscription',
      'message_sent'
    ]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: String,
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  metadata: {
    ip: String,
    userAgent: String,
    location: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
activitySchema.index({ type: 1, timestamp: -1 });
activitySchema.index({ user: 1, timestamp: -1 });

export default mongoose.model('Activity', activitySchema);
