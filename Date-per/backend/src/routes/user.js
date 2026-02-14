const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const currentUser = await User.findById(req.userId);
    const isLiked = currentUser.likes.includes(req.params.id);
    
    // Calculate distance
    let distance = 'Unknown';
    if (currentUser.location && user.location) {
      const lat1 = currentUser.location.coordinates[1];
      const lon1 = currentUser.location.coordinates[0];
      const lat2 = user.location.coordinates[1];
      const lon2 = user.location.coordinates[0];
      
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const d = R * c;
      distance = d < 1 ? `${Math.round(d * 1000)}m away` : `${Math.round(d)}km away`;
    }
    
    res.json({
      ...user.toObject(),
      id: user._id,
      photo: user.photo || user.profilePhoto,
      distance: distance,
      likesCount: user.likedBy.length,
      isLiked
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
