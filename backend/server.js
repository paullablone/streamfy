import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { signup, login, verifyToken } from './auth.js';
import connectDB from './config/database.js';
import adminRoutes from './routes/admin.js';
import youtubeRoutes from './routes/youtube.js';
import monetizationRoutes from './routes/monetization.js';
import gamificationRoutes from './routes/gamification.js';
import watchHistoryRoutes from './routes/watchHistory.js';
import recommendationsRoutes from './routes/recommendations.js';
import offlineRoutes from './routes/offline.js';
import socialRoutes from './routes/social.js';
import streamDJRoutes from './routes/streamDJ.js';
import User from './models/User.js';
import Channel from './models/Channel.js';
import Activity from './models/Activity.js';
import Gift from './models/Gift.js';
import Poll from './models/Poll.js';
import WatchParty from './models/WatchParty.js';

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Auth routes
app.post('/api/signup', signup);
app.post('/api/login', login);
app.get('/api/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Admin routes
app.use('/api/admin', adminRoutes);

// YouTube API routes
app.use('/api/youtube', youtubeRoutes);

// Monetization routes
app.use('/api/monetization', monetizationRoutes);

// Gamification routes
app.use('/api/gamification', gamificationRoutes);

// Watch History routes
app.use('/api/watch-history', watchHistoryRoutes);

// AI Recommendations routes
app.use('/api/recommendations', recommendationsRoutes);

// Offline Playback routes
app.use('/api/offline', offlineRoutes);

// Social features routes
app.use('/api/social', socialRoutes);

// Stream DJ routes
app.use('/api/stream-dj', streamDJRoutes);

// Channel routes
app.post('/api/channels/create', verifyToken, async (req, res) => {
  try {
    const { channelName, description, category, avatar } = req.body;
    const userId = req.user.id;
    
    const channelId = `channel-${userId}-${Date.now()}`;
    const channel = {
      id: channelId,
      name: channelName,
      description,
      category,
      avatar: avatar || '📺',
      owner: userId,
      ownerName: req.user.username,
      subscribers: 0,
      createdAt: Date.now(),
      isLive: false
    };
    
    channels.set(channelId, channel);
    channelContent.set(channelId, []);
    channelSubscribers.set(channelId, new Set());

    // Save to MongoDB
    await Channel.create({
      channelId,
      name: channelName,
      description,
      category,
      avatar: avatar || '📺',
      owner: userId,
      ownerName: req.user.username
    });

    // Log activity
    await Activity.create({
      type: 'channel_created',
      username: req.user.username,
      details: { channelId, channelName, category }
    });
    
    res.json({ success: true, channel });
  } catch (error) {
    console.error('Channel creation error:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

app.get('/api/channels', (req, res) => {
  const allChannels = Array.from(channels.values());
  res.json({ channels: allChannels });
});

app.get('/api/channels/:channelId', (req, res) => {
  const channel = channels.get(req.params.channelId);
  if (!channel) {
    return res.status(404).json({ error: 'Channel not found' });
  }
  const content = channelContent.get(req.params.channelId) || [];
  const subscribers = channelSubscribers.get(req.params.channelId)?.size || 0;
  res.json({ channel: { ...channel, subscribers }, content });
});

app.post('/api/channels/:channelId/content', verifyToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { title, description, videoUrl, thumbnail, type } = req.body;
    const channel = channels.get(channelId);
    
    if (!channel || channel.owner !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const content = {
      id: `content-${Date.now()}`,
      title,
      description,
      videoUrl,
      thumbnail,
      type: type || 'video',
      uploadedAt: Date.now(),
      views: 0,
      likes: 0
    };
    
    const channelContents = channelContent.get(channelId) || [];
    channelContents.unshift(content);
    channelContent.set(channelId, channelContents);

    // Log activity
    await Activity.create({
      type: 'content_uploaded',
      username: req.user.username,
      details: { channelId, contentTitle: title, contentType: type || 'video' }
    });
    
    res.json({ success: true, content });
  } catch (error) {
    console.error('Content upload error:', error);
    res.status(500).json({ error: 'Failed to upload content' });
  }
});

app.post('/api/channels/:channelId/subscribe', verifyToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;
    
    if (!channelSubscribers.has(channelId)) {
      channelSubscribers.set(channelId, new Set());
    }
    
    const subs = channelSubscribers.get(channelId);
    const isSubscribed = subs.has(userId);
    
    if (isSubscribed) {
      subs.delete(userId);
    } else {
      subs.add(userId);
    }
    
    const channel = channels.get(channelId);
    if (channel) {
      channel.subscribers = subs.size;
    }

    // Log activity
    if (!isSubscribed) {
      await Activity.create({
        type: 'subscription',
        username: req.user.username,
        details: { channelId, action: 'subscribed' }
      });
    }
    
    res.json({ success: true, subscribed: !isSubscribed, subscribers: subs.size });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

app.get('/api/my-channel', verifyToken, (req, res) => {
  const userId = req.user.id;
  const userChannel = Array.from(channels.values()).find(ch => ch.owner === userId);
  
  if (!userChannel) {
    return res.json({ channel: null });
  }
  
  const content = channelContent.get(userChannel.id) || [];
  const subscribers = channelSubscribers.get(userChannel.id)?.size || 0;
  res.json({ channel: { ...userChannel, subscribers }, content });
});

// Discover endpoints
app.get('/api/discover', (req, res) => {
  const recentStories = stories.slice(0, 20);
  const recentClips = clips.slice(0, 20);
  
  res.json({
    streams: liveStreams,
    clips: recentClips,
    stories: recentStories
  });
});

app.post('/api/stories/create', verifyToken, async (req, res) => {
  try {
    const { image, caption } = req.body;
    const userId = req.user.id;
    
    const story = {
      id: `story-${Date.now()}`,
      userId,
      username: req.user.username,
      avatar: '👤',
      image,
      caption,
      createdAt: Date.now(),
      timeAgo: 'Just now'
    };
    
    stories.unshift(story);
    
    // Keep only last 100 stories
    if (stories.length > 100) {
      stories.pop();
    }

    // Log activity
    await Activity.create({
      type: 'content_uploaded',
      username: req.user.username,
      details: { type: 'story', caption }
    });
    
    res.json({ success: true, story });
  } catch (error) {
    console.error('Story creation error:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
});

app.post('/api/clips/create', verifyToken, async (req, res) => {
  try {
    const { title, streamId, thumbnail } = req.body;
    const userId = req.user.id;
    
    const clip = {
      id: `clip-${Date.now()}`,
      userId,
      creator: req.user.username,
      title,
      streamId,
      thumbnail,
      duration: '0:30',
      views: 0,
      likes: 0,
      createdAt: Date.now()
    };
    
    clips.unshift(clip);
    
    // Keep only last 100 clips
    if (clips.length > 100) {
      clips.pop();
    }

    // Log activity
    await Activity.create({
      type: 'content_uploaded',
      username: req.user.username,
      details: { type: 'clip', title }
    });
    
    res.json({ success: true, clip });
  } catch (error) {
    console.error('Clip creation error:', error);
    res.status(500).json({ error: 'Failed to create clip' });
  }
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for network access
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();
const users = new Map();
const channels = new Map(); // Store user channels
const channelContent = new Map(); // Store channel videos/content
const channelSubscribers = new Map(); // Store channel subscribers
const stories = []; // Store user stories
const clips = []; // Store user clips
const liveStreams = []; // Store active live streams

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', async ({ roomId, username }) => {
    socket.join(roomId);
    users.set(socket.id, { username, roomId });
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);

    socket.to(roomId).emit('user-joined', { userId: socket.id, username });
    
    const roomUsers = Array.from(rooms.get(roomId))
      .filter(id => id !== socket.id)
      .map(id => ({ userId: id, username: users.get(id)?.username }));
    
    socket.emit('room-users', roomUsers);
    
    const viewerCount = rooms.get(roomId).size;
    io.to(roomId).emit('viewer-count', viewerCount);

    // Log activity to database
    try {
      await Activity.create({
        type: 'stream_started',
        username,
        details: { roomId, viewerCount: 1 }
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  });

  socket.on('offer', ({ offer, to }) => {
    socket.to(to).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ answer, to }) => {
    socket.to(to).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, to }) => {
    socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  socket.on('chat-message', async ({ roomId, message }) => {
    const user = users.get(socket.id);
    const username = user?.username || 'Anonymous';
    io.to(roomId).emit('chat-message', {
      username,
      message,
      timestamp: Date.now()
    });

    // Log activity to database
    try {
      await Activity.create({
        type: 'message_sent',
        username,
        details: { roomId, message }
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  });

  socket.on('reaction', ({ roomId, emoji, username }) => {
    io.to(roomId).emit('reaction', { emoji, username });
  });

  socket.on('request-viewer-count', ({ roomId }) => {
    const count = rooms.get(roomId)?.size || 0;
    io.to(roomId).emit('viewer-count', count);
  });

  // Channel events
  socket.on('channel-go-live', async ({ channelId }) => {
    const channel = channels.get(channelId);
    if (channel) {
      channel.isLive = true;
      io.emit('channel-status-change', { channelId, isLive: true });

      // Log activity to database
      try {
        await Activity.create({
          type: 'stream_started',
          username: channel.ownerName,
          details: { channelId, channelName: channel.name }
        });
      } catch (err) {
        console.error('Failed to log activity:', err);
      }
    }
  });

  socket.on('channel-stop-live', async ({ channelId }) => {
    const channel = channels.get(channelId);
    if (channel) {
      channel.isLive = false;
      io.emit('channel-status-change', { channelId, isLive: false });

      // Log activity to database
      try {
        await Activity.create({
          type: 'stream_ended',
          username: channel.ownerName,
          details: { channelId, channelName: channel.name }
        });
      } catch (err) {
        console.error('Failed to log activity:', err);
      }
    }
  });

  socket.on('channel-message', ({ channelId, message, username }) => {
    io.to(`channel-${channelId}`).emit('channel-message', {
      username,
      message,
      timestamp: Date.now()
    });
  });

  socket.on('join-channel', ({ channelId }) => {
    socket.join(`channel-${channelId}`);
  });

  socket.on('leave-channel', ({ channelId }) => {
    socket.leave(`channel-${channelId}`);
  });

  socket.on('story-created', async (story) => {
    io.emit('new-story', story);

    // Log activity to database
    try {
      await Activity.create({
        type: 'content_uploaded',
        username: story.username,
        details: { type: 'story', caption: story.caption }
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  });

  socket.on('clip-created', async (clip) => {
    io.emit('new-clip', clip);

    // Log activity to database
    try {
      await Activity.create({
        type: 'content_uploaded',
        username: clip.creator,
        details: { type: 'clip', title: clip.title }
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      const { roomId } = user;
      socket.to(roomId).emit('user-left', { userId: socket.id });
      
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(socket.id);
        if (rooms.get(roomId).size === 0) {
          rooms.delete(roomId);
        } else {
          const viewerCount = rooms.get(roomId).size;
          io.to(roomId).emit('viewer-count', viewerCount);
        }
      }
      users.delete(socket.id);
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3002;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 Streamfy server running on port ${PORT}`);
  console.log(`📡 Network access: http://192.168.67.161:${PORT}`);
  console.log(`🏠 Local access: http://localhost:${PORT}`);
});
