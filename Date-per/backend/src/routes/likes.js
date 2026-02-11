const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

router.post('/toggle/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(req.params.userId);
    
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const hasLiked = currentUser.likes.includes(req.params.userId);
    
    if (hasLiked) {
      currentUser.likes = currentUser.likes.filter(id => id.toString() !== req.params.userId);
      targetUser.likedBy = targetUser.likedBy.filter(id => id.toString() !== req.userId);
    } else {
      currentUser.likes.push(req.params.userId);
      targetUser.likedBy.push(req.userId);
      
      // Create notification
      const notification = new Notification({
        recipient: req.params.userId,
        sender: req.userId,
        type: 'like',
        message: `${currentUser.name} liked your profile!`
      });
      await notification.save();
      
      // Emit socket event to notify the liked user
      if (req.io) {
        req.io.to(req.params.userId).emit('likeNotification', {
          type: 'like',
          likerName: currentUser.name,
          likerId: req.userId,
          message: `${currentUser.name} liked your profile!`,
          notificationId: notification._id
        });
      }
    }
    
    await currentUser.save();
    await targetUser.save();
    
    res.json({ 
      liked: !hasLiked,
      likesCount: targetUser.likedBy.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
