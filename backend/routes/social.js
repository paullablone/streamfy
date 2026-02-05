import express from 'express';
import { verifyToken } from '../auth.js';
import Friendship from '../models/Friendship.js';
import WatchTogether from '../models/WatchTogether.js';
import StreamMatch from '../models/StreamMatch.js';
import CommunityPoll from '../models/CommunityPoll.js';
import User from '../models/User.js';

const router = express.Router();

// ============ FRIEND STREAMS ============

// Send friend request
router.post('/friends/request', verifyToken, async (req, res) => {
  try {
    const { friendUsername } = req.body;
    const userId = req.user.id;

    // Find friend by username
    const friend = await User.findOne({ username: friendUsername });
    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (friend._id.toString() === userId) {
      return res.status(400).json({ error: 'Cannot add yourself as friend' });
    }

    // Check if friendship already exists
    const existing = await Friendship.findOne({
      $or: [
        { userId, friendId: friend._id.toString() },
        { userId: friend._id.toString(), friendId: userId }
      ]
    });

    if (existing) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }

    const friendship = await Friendship.create({
      userId,
      friendId: friend._id.toString(),
      status: 'pending'
    });

    res.json({ success: true, friendship });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept friend request
router.post('/friends/accept/:friendshipId', verifyToken, async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.friendshipId);
    
    if (!friendship) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendship.friendId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    friendship.status = 'accepted';
    await friendship.save();

    res.json({ success: true, friendship });
  } catch (error) {
    console.error('Accept friend error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Get friends list
router.get('/friends', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const friendships = await Friendship.find({
      $or: [{ userId }, { friendId: userId }],
      status: 'accepted'
    });

    // Get friend IDs
    const friendIds = friendships.map(f => 
      f.userId === userId ? f.friendId : f.userId
    );

    // Get friend details
    const friends = await User.find({ _id: { $in: friendIds } })
      .select('username email createdAt');

    res.json({ success: true, friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// Get friend requests
router.get('/friends/requests', verifyToken, async (req, res) => {
  try {
    const requests = await Friendship.find({
      friendId: req.user.id,
      status: 'pending'
    });

    // Get requester details
    const requesterIds = requests.map(r => r.userId);
    const requesters = await User.find({ _id: { $in: requesterIds } })
      .select('username');

    const requestsWithDetails = requests.map(r => ({
      ...r.toObject(),
      requester: requesters.find(u => u._id.toString() === r.userId)
    }));

    res.json({ success: true, requests: requestsWithDetails });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to get friend requests' });
  }
});

// ============ WATCH TOGETHER ============

// Create watch together room
router.post('/watch-together/create', verifyToken, async (req, res) => {
  try {
    const { streamUrl, streamTitle } = req.body;
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const room = await WatchTogether.create({
      roomId,
      hostId: req.user.id,
      hostName: req.user.username,
      streamUrl,
      streamTitle,
      participants: [{
        userId: req.user.id,
        username: req.user.username,
        joinedAt: new Date()
      }]
    });

    res.json({ success: true, room });
  } catch (error) {
    console.error('Create watch together error:', error);
    res.status(500).json({ error: 'Failed to create watch together room' });
  }
});

// Join watch together room
router.post('/watch-together/join/:roomId', verifyToken, async (req, res) => {
  try {
    const room = await WatchTogether.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!room.isActive) {
      return res.status(400).json({ error: 'Room is no longer active' });
    }

    // Check if already in room
    const alreadyIn = room.participants.some(p => p.userId === req.user.id);
    if (!alreadyIn) {
      room.participants.push({
        userId: req.user.id,
        username: req.user.username,
        joinedAt: new Date()
      });
      await room.save();
    }

    res.json({ success: true, room });
  } catch (error) {
    console.error('Join watch together error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Get active watch together rooms
router.get('/watch-together/rooms', verifyToken, async (req, res) => {
  try {
    const rooms = await WatchTogether.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// ============ STREAM LOVERS (MATCHING) ============

// Update user interests
router.post('/match/interests', verifyToken, async (req, res) => {
  try {
    const { interests, favoriteCategories } = req.body;

    let profile = await StreamMatch.findOne({ userId: req.user.id });

    if (!profile) {
      profile = await StreamMatch.create({
        userId: req.user.id,
        username: req.user.username,
        interests,
        favoriteCategories
      });
    } else {
      profile.interests = interests;
      profile.favoriteCategories = favoriteCategories;
      profile.updatedAt = new Date();
      await profile.save();
    }

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Update interests error:', error);
    res.status(500).json({ error: 'Failed to update interests' });
  }
});

// Find matches
router.get('/match/find', verifyToken, async (req, res) => {
  try {
    const userProfile = await StreamMatch.findOne({ userId: req.user.id });

    if (!userProfile) {
      return res.json({ success: true, matches: [] });
    }

    // Find other users with similar interests
    const allProfiles = await StreamMatch.find({
      userId: { $ne: req.user.id }
    });

    const matches = allProfiles.map(profile => {
      // Calculate match score
      const commonInterests = profile.interests.filter(i => 
        userProfile.interests.includes(i)
      );
      const commonCategories = profile.favoriteCategories.filter(c => 
        userProfile.favoriteCategories.includes(c)
      );

      const matchScore = (commonInterests.length * 10) + (commonCategories.length * 5);

      return {
        userId: profile.userId,
        username: profile.username,
        matchScore,
        commonInterests,
        commonCategories
      };
    }).filter(m => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    res.json({ success: true, matches });
  } catch (error) {
    console.error('Find matches error:', error);
    res.status(500).json({ error: 'Failed to find matches' });
  }
});

// ============ COMMUNITY POLLS ============

// Create poll
router.post('/polls/create', verifyToken, async (req, res) => {
  try {
    const { channelId, question, options, duration } = req.body;

    const endsAt = duration ? new Date(Date.now() + duration * 60000) : null;

    const poll = await CommunityPoll.create({
      channelId,
      creatorId: req.user.id,
      creatorName: req.user.username,
      question,
      options: options.map(text => ({ text, votes: 0, voters: [] })),
      endsAt
    });

    res.json({ success: true, poll });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// Vote on poll
router.post('/polls/vote/:pollId', verifyToken, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await CommunityPoll.findById(req.params.pollId);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (!poll.isActive) {
      return res.status(400).json({ error: 'Poll is closed' });
    }

    if (poll.endsAt && new Date() > poll.endsAt) {
      poll.isActive = false;
      await poll.save();
      return res.status(400).json({ error: 'Poll has ended' });
    }

    // Check if user already voted
    const alreadyVoted = poll.options.some(opt => 
      opt.voters.includes(req.user.id)
    );

    if (alreadyVoted) {
      return res.status(400).json({ error: 'Already voted' });
    }

    // Add vote
    poll.options[optionIndex].votes += 1;
    poll.options[optionIndex].voters.push(req.user.id);
    poll.totalVotes += 1;
    await poll.save();

    res.json({ success: true, poll });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// Get polls for channel
router.get('/polls/channel/:channelId', async (req, res) => {
  try {
    const polls = await CommunityPoll.find({
      channelId: req.params.channelId,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({ success: true, polls });
  } catch (error) {
    console.error('Get polls error:', error);
    res.status(500).json({ error: 'Failed to get polls' });
  }
});

// Get poll results
router.get('/polls/:pollId', async (req, res) => {
  try {
    const poll = await CommunityPoll.findById(req.params.pollId);

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    res.json({ success: true, poll });
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ error: 'Failed to get poll' });
  }
});

export default router;
