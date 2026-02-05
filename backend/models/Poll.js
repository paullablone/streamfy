import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema({
  pollId: {
    type: String,
    required: true,
    unique: true
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    text: String,
    votes: { type: Number, default: 0 }
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creatorUsername: String,
  roomId: String,
  duration: Number,
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  ended: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date
});

export default mongoose.model('Poll', pollSchema);
