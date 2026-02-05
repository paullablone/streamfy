import mongoose from 'mongoose';

const friendshipSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  friendId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
friendshipSchema.index({ userId: 1, friendId: 1 }, { unique: true });

export default mongoose.model('Friendship', friendshipSchema);
