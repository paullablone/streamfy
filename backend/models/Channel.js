import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerUsername: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  tags: [String],
  stats: {
    subscribers: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalStreams: { type: Number, default: 0 },
    averageViewers: { type: Number, default: 0 }
  },
  content: [{
    type: {
      type: String,
      enum: ['video', 'stream', 'clip']
    },
    title: String,
    url: String,
    thumbnail: String,
    duration: Number,
    views: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now }
  }],
  isLive: {
    type: Boolean,
    default: false
  },
  currentViewers: {
    type: Number,
    default: 0
  },
  streamKey: String,
  settings: {
    allowChat: { type: Boolean, default: true },
    allowGifts: { type: Boolean, default: true },
    allowPolls: { type: Boolean, default: true },
    mature: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

channelSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Channel', channelSchema);
