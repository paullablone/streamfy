import mongoose from 'mongoose';

const streamDJSchema = new mongoose.Schema({
  channelId: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  currentTrack: {
    title: String,
    artist: String,
    url: String,
    addedBy: String,
    votes: { type: Number, default: 0 }
  },
  queue: [{
    title: String,
    artist: String,
    url: String,
    addedBy: String,
    addedByUsername: String,
    votes: { type: Number, default: 0 },
    voters: [String],
    addedAt: { type: Date, default: Date.now }
  }],
  playedTracks: [{
    title: String,
    artist: String,
    playedAt: Date,
    addedBy: String
  }],
  settings: {
    allowViewerRequests: { type: Boolean, default: true },
    maxQueueSize: { type: Number, default: 20 },
    votingEnabled: { type: Boolean, default: true },
    autoPlay: { type: Boolean, default: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('StreamDJ', streamDJSchema);
