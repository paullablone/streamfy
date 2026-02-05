import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  badgeId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  icon: String,
  color: String,
  category: {
    type: String,
    enum: ['streaming', 'viewing', 'social', 'engagement', 'special', 'achievement'],
    required: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  requirement: {
    type: String,
    required: true
  },
  requiredValue: Number,
  xpReward: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Badge', badgeSchema);
