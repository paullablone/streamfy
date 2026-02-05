import mongoose from 'mongoose';

const sponsorshipSchema = new mongoose.Schema({
  sponsor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  streamer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true
  },
  benefits: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'pending', 'expired', 'cancelled'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  autoRenew: {
    type: Boolean,
    default: true
  },
  channelId: String,
  customMessage: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for queries
sponsorshipSchema.index({ streamer: 1, status: 1 });
sponsorshipSchema.index({ sponsor: 1, status: 1 });

export default mongoose.model('Sponsorship', sponsorshipSchema);
