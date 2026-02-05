import express from 'express';
import User from '../models/User.js';
import Channel from '../models/Channel.js';
import Activity from '../models/Activity.js';
import Gift from '../models/Gift.js';
import Poll from '../models/Poll.js';
import WatchParty from '../models/WatchParty.js';

const router = express.Router();

// Middleware to check admin access
const isAdmin = (req, res, next) => {
  // In production, implement proper JWT verification
  const adminKey = req.headers['x-admin-key'];
  if (adminKey === process.env.ADMIN_KEY || adminKey === 'streamfy-admin-2026') {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized' });
  }
};

// Dashboard Statistics
router.get('/dashboard/stats', isAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalChannels,
      activeUsers,
      totalGifts,
      totalPolls,
      totalWatchParties,
      recentActivities
    ] = await Promise.all([
      User.countDocuments(),
      Channel.countDocuments(),
      User.countDocuments({ isActive: true }),
      Gift.countDocuments(),
      Poll.countDocuments(),
      WatchParty.countDocuments(),
      Activity.find().sort({ timestamp: -1 }).limit(50)
    ]);

    // Calculate revenue (from gifts)
    const giftsAggregation = await Gift.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$giftType.cost' }
        }
      }
    ]);
    const totalRevenue = giftsAggregation[0]?.totalRevenue || 0;

    // Get user growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      stats: {
        totalUsers,
        totalChannels,
        activeUsers,
        totalGifts,
        totalPolls,
        totalWatchParties,
        totalRevenue,
        newUsers
      },
      recentActivities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users with pagination
router.get('/users', isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all channels
router.get('/channels', isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const channels = await Channel.find()
      .populate('owner', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Channel.countDocuments();

    res.json({
      channels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all activities
router.get('/activities', isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const type = req.query.type;

    const query = type ? { type } : {};

    const activities = await Activity.find(query)
      .populate('user', 'username email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Activity.countDocuments(query);

    res.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user details
router.get('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userActivities = await Activity.find({ user: req.params.id })
      .sort({ timestamp: -1 })
      .limit(20);

    const userChannels = await Channel.find({ owner: req.params.id });

    res.json({
      user,
      activities: userActivities,
      channels: userChannels
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user status
router.patch('/users/:id/status', isAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Channel.deleteMany({ owner: req.params.id });
    await Activity.deleteMany({ user: req.params.id });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics endpoints
router.get('/analytics/users', isAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({ userGrowth });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics/revenue', isAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const revenueData = await Gift.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          revenue: { $sum: '$giftType.cost' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({ revenueData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
