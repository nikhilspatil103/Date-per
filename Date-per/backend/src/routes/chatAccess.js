const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const ChatAccess = require('../models/ChatAccess');

const router = express.Router();

router.post('/unlock/:targetUserId', auth, async (req, res) => {
  try {
    const targetUserId = req.params.targetUserId;
    
    // Check if already has access
    const existingAccess = await ChatAccess.findOne({
      userId: req.userId,
      targetUserId,
      expiresAt: { $gt: new Date() }
    });
    
    if (existingAccess) {
      const user = await User.findById(req.userId).select('coins');
      return res.json({ 
        hasAccess: true, 
        expiresAt: existingAccess.expiresAt,
        coins: user.coins || 100,
        message: 'Already have access'
      });
    }
    
    // Check coins
    const user = await User.findById(req.userId);
    console.log('Before deduction - User coins:', user.coins);
    
    if (!user.coins) {
      user.coins = 100; // Initialize if undefined
    }
    
    if (user.coins < 10) {
      return res.status(400).json({ 
        hasAccess: false, 
        message: 'Insufficient coins',
        coins: user.coins
      });
    }
    
    // Deduct coins
    user.coins -= 10;
    await user.save();
    console.log('After deduction - User coins:', user.coins);
    
    // Grant 24-hour access
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await ChatAccess.create({
      userId: req.userId,
      targetUserId,
      expiresAt
    });
    
    res.json({ 
      hasAccess: true, 
      expiresAt,
      coins: user.coins,
      message: 'Chat unlocked for 24 hours'
    });
  } catch (error) {
    console.error('Unlock error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/check/:targetUserId', auth, async (req, res) => {
  try {
    const access = await ChatAccess.findOne({
      userId: req.userId,
      targetUserId: req.params.targetUserId,
      expiresAt: { $gt: new Date() }
    });
    
    const user = await User.findById(req.userId).select('coins');
    console.log('Check access - User coins:', user.coins);
    
    res.json({ 
      hasAccess: !!access,
      expiresAt: access?.expiresAt,
      coins: user.coins || 100
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
