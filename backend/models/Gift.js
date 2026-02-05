import mongoose from 'mongoose';

const giftSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromUsername: {
    type: String,
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUsername: {
    type: String,
    required: true
  },
  giftType: {
    id: Number,
    emoji: String,
    name: String,
    cost: Number,
    color: String
  },
  roomId: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

giftSchema.index({ from: 1, timestamp: -1 });
giftSchema.index({ to: 1, timestamp: -1 });

export default mongoose.model('Gift', giftSchema);
