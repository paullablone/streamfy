import mongoose from 'mongoose';

const communityPollSchema = new mongoose.Schema({
  channelId: {
    type: String,
    required: true
  },
  creatorId: {
    type: String,
    required: true
  },
  creatorName: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    text: String,
    votes: {
      type: Number,
      default: 0
    },
    voters: [String] // userId array
  }],
  totalVotes: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  endsAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('CommunityPoll', communityPollSchema);
