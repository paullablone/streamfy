import mongoose from 'mongoose';

const watchPartySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  roomId: {
    type: String,
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostUsername: String,
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date
});

export default mongoose.model('WatchParty', watchPartySchema);
