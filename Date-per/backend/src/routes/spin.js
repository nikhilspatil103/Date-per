const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Check if user can spin
router.get('/check', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const now = new Date();
    const canSpin = !user.lastSpinTime || (now - user.lastSpinTime) >= 24 * 60 * 60 * 1000;
    
    let nextSpinTime = null;
    if (!canSpin && user.lastSpinTime) {
      nextSpinTime = new Date(user.lastSpinTime.getTime() + 24 * 60 * 60 * 1000);
    }

    res.json({ canSpin, nextSpinTime });
  } catch (error) {
    console.error('Check spin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Claim spin reward
router.post('/claim', auth, async (req, res) => {
  try {
    const { coins } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const now = new Date();
    const canSpin = !user.lastSpinTime || (now - user.lastSpinTime) >= 24 * 60 * 60 * 1000;
    
    if (!canSpin) {
      return res.status(400).json({ message: 'Spin not available yet' });
    }

    user.coins = (user.coins || 0) + coins;
    user.lastSpinTime = now;
    await user.save();

    res.json({ success: true, coins: user.coins });
  } catch (error) {
    console.error('Claim spin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
