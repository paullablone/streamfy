import mongoose from 'mongoose';

const watchTogetherSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  hostId: {
    type: String,
    required: true
  },
  hostName: {
    type: String,
    required: true
  },
  streamUrl: {
    type: String,
    required: true
  },
  streamTitle: {
    type: String,
    required: true
  },
  participants: [{
    userId: String,
    username: String,
    joinedAt: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('WatchTogether', watchTogetherSchema);
