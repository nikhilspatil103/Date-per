const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const userLat = currentUser.location?.coordinates[1] || 0;
    const userLng = currentUser.location?.coordinates[0] || 0;
    
    const genderFilter = { _id: { $ne: req.userId } };
    if (currentUser.interestIn === 'Male') {
      genderFilter.gender = 'Male';
    } else if (currentUser.interestIn === 'Female') {
      genderFilter.gender = 'Female';
    }
    
    const users = await User.find(genderFilter)
      .select('name age bio profilePhoto photos online lastSeen location gender likedBy');
    
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    const profiles = users.map(user => {
      const contactLat = user.location?.coordinates[1] || 0;
      const contactLng = user.location?.coordinates[0] || 0;
      const distanceKm = calculateDistance(userLat, userLng, contactLat, contactLng);
      const distance = distanceKm > 0 ? `${Math.round(distanceKm)} km away` : 'Nearby';
      
      return {
        _id: user._id,
        id: user._id,
        name: user.name,
        age: user.age,
        gender: user.gender,
        bio: user.bio || 'No bio yet',
        photo: user.profilePhoto,
        distance,
        online: user.online,
        lastSeen: user.lastSeen,
        likesCount: user.likedBy?.length || 0,
        isLiked: currentUser.likes?.some(likeId => likeId.toString() === user._id.toString()) || false
      };
    });
    
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
