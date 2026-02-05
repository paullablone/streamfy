import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  currency: {
    type: String,
    default: 'USD'
  },
  message: {
    type: String,
    maxlength: 200
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'crypto'],
    required: true
  },
  transactionId: String,
  channelId: String,
  streamId: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for quick queries
donationSchema.index({ recipient: 1, createdAt: -1 });
donationSchema.index({ donor: 1, createdAt: -1 });

export default mongoose.model('Donation', donationSchema);
