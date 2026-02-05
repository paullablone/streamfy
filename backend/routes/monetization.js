import express from 'express';
import Donation from '../models/Donation.js';
import Sponsorship from '../models/Sponsorship.js';
import User from '../models/User.js';
import { authenticateToken } from '../auth.js';

const router = express.Router();

// Get donation tiers/options
router.get('/donation-tiers', (req, res) => {
  const tiers = [
    { amount: 5, label: '$5', emoji: '☕', message: 'Buy me a coffee' },
    { amount: 10, label: '$10', emoji: '🍕', message: 'Buy me pizza' },
    { amount: 25, label: '$25', emoji: '🎮', message: 'Support my stream' },
    { amount: 50, label: '$50', emoji: '⭐', message: 'Super supporter' },
    { amount: 100, label: '$100', emoji: '💎', message: 'Diamond supporter' },
    { amount: 0, label: 'Custom', emoji: '💰', message: 'Custom amount' }
  ];
  
  res.json({ success: true, tiers });
});

// Create donation
router.post('/donate', authenticateToken, async (req, res) => {
  try {
    const { recipientId, amount, message, isAnonymous, paymentMethod } = req.body;
    
    if (!recipientId || !amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid donation data' });
    }
    
    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    
    // Create donation
    const donation = new Donation({
      donor: req.user.userId,
      recipient: recipientId,
      amount,
      message: message || '',
      isAnonymous: isAnonymous || false,
      paymentMethod: paymentMethod || 'card',
      status: 'completed', // In production, this would be 'pending' until payment confirms
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
    
    await donation.save();
    
    res.json({
      success: true,
      donation: {
        id: donation._id,
        amount: donation.amount,
        message: donation.message,
        transactionId: donation.transactionId
      }
    });
  } catch (error) {
    console.error('Donation error:', error);
    res.status(500).json({ error: 'Failed to process donation' });
  }
});

// Get user's donations (sent)
router.get('/my-donations', authenticateToken, async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.userId })
      .populate('recipient', 'username')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, donations });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// Get donations received
router.get('/received-donations', authenticateToken, async (req, res) => {
  try {
    const donations = await Donation.find({ recipient: req.user.userId })
      .populate('donor', 'username')
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Calculate total
    const total = donations.reduce((sum, d) => sum + d.amount, 0);
    
    res.json({ success: true, donations, total });
  } catch (error) {
    console.error('Get received donations error:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// Get sponsorship tiers
router.get('/sponsorship-tiers', (req, res) => {
  const tiers = [
    {
      tier: 'bronze',
      name: 'Bronze Sponsor',
      amount: 50,
      duration: 'monthly',
      color: '#cd7f32',
      benefits: [
        'Sponsor badge in chat',
        'Priority support',
        'Exclusive Discord role',
        'Early access to content'
      ]
    },
    {
      tier: 'silver',
      name: 'Silver Sponsor',
      amount: 100,
      duration: 'monthly',
      color: '#c0c0c0',
      benefits: [
        'All Bronze benefits',
        'Custom emotes',
        'Shoutout in streams',
        'Behind-the-scenes content',
        'Monthly Q&A access'
      ]
    },
    {
      tier: 'gold',
      name: 'Gold Sponsor',
      amount: 250,
      duration: 'monthly',
      color: '#ffd700',
      benefits: [
        'All Silver benefits',
        'Logo in stream overlay',
        'Dedicated video shoutout',
        'Private Discord channel',
        'Influence content decisions'
      ]
    },
    {
      tier: 'platinum',
      name: 'Platinum Sponsor',
      amount: 500,
      duration: 'monthly',
      color: '#e5e4e2',
      benefits: [
        'All Gold benefits',
        'Co-streaming opportunities',
        'Exclusive merchandise',
        'Personal thank you video',
        'Direct line to creator',
        'Featured on channel page'
      ]
    }
  ];
  
  res.json({ success: true, tiers });
});

// Create sponsorship
router.post('/sponsor', authenticateToken, async (req, res) => {
  try {
    const { streamerId, tier, duration, customMessage } = req.body;
    
    if (!streamerId || !tier || !duration) {
      return res.status(400).json({ error: 'Invalid sponsorship data' });
    }
    
    // Verify streamer exists
    const streamer = await User.findById(streamerId);
    if (!streamer) {
      return res.status(404).json({ error: 'Streamer not found' });
    }
    
    // Get tier details
    const tierAmounts = {
      bronze: 50,
      silver: 100,
      gold: 250,
      platinum: 500
    };
    
    const amount = tierAmounts[tier];
    
    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (duration === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (duration === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    } else if (duration === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    
    // Create sponsorship
    const sponsorship = new Sponsorship({
      sponsor: req.user.userId,
      streamer: streamerId,
      tier,
      amount,
      duration,
      startDate,
      endDate,
      customMessage: customMessage || '',
      status: 'active' // In production, would be 'pending' until payment
    });
    
    await sponsorship.save();
    
    res.json({
      success: true,
      sponsorship: {
        id: sponsorship._id,
        tier: sponsorship.tier,
        amount: sponsorship.amount,
        endDate: sponsorship.endDate
      }
    });
  } catch (error) {
    console.error('Sponsorship error:', error);
    res.status(500).json({ error: 'Failed to create sponsorship' });
  }
});

// Get user's sponsorships (as sponsor)
router.get('/my-sponsorships', authenticateToken, async (req, res) => {
  try {
    const sponsorships = await Sponsorship.find({ sponsor: req.user.userId })
      .populate('streamer', 'username')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, sponsorships });
  } catch (error) {
    console.error('Get sponsorships error:', error);
    res.status(500).json({ error: 'Failed to fetch sponsorships' });
  }
});

// Get sponsorships received (as streamer)
router.get('/received-sponsorships', authenticateToken, async (req, res) => {
  try {
    const sponsorships = await Sponsorship.find({ 
      streamer: req.user.userId,
      status: 'active'
    })
      .populate('sponsor', 'username')
      .sort({ createdAt: -1 });
    
    // Calculate total monthly revenue
    const monthlyRevenue = sponsorships.reduce((sum, s) => {
      if (s.duration === 'monthly') return sum + s.amount;
      if (s.duration === 'quarterly') return sum + (s.amount / 3);
      if (s.duration === 'yearly') return sum + (s.amount / 12);
      return sum;
    }, 0);
    
    res.json({ success: true, sponsorships, monthlyRevenue });
  } catch (error) {
    console.error('Get received sponsorships error:', error);
    res.status(500).json({ error: 'Failed to fetch sponsorships' });
  }
});

// Get earnings summary
router.get('/earnings', authenticateToken, async (req, res) => {
  try {
    // Get donations
    const donations = await Donation.find({ 
      recipient: req.user.userId,
      status: 'completed'
    });
    
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    
    // Get active sponsorships
    const sponsorships = await Sponsorship.find({ 
      streamer: req.user.userId,
      status: 'active'
    });
    
    const monthlySponsorship = sponsorships.reduce((sum, s) => {
      if (s.duration === 'monthly') return sum + s.amount;
      if (s.duration === 'quarterly') return sum + (s.amount / 3);
      if (s.duration === 'yearly') return sum + (s.amount / 12);
      return sum;
    }, 0);
    
    res.json({
      success: true,
      earnings: {
        totalDonations,
        monthlySponsorship,
        totalEarnings: totalDonations + monthlySponsorship,
        donationCount: donations.length,
        sponsorCount: sponsorships.length
      }
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

export default router;
