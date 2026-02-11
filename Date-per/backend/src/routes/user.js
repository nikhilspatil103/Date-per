const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email photo profilePhoto age gender bio online lastSeen location likedBy');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const currentUser = await User.findById(req.userId);
    const isLiked = currentUser.likes.includes(req.params.id);
    
    res.json({
      ...user.toObject(),
      likesCount: user.likedBy.length,
      isLiked
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
