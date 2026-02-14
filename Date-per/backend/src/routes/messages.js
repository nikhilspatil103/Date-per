const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const Report = require('../models/Report');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/chats/list', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    console.log('Chat list for user:', userId);
    
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          user: {
            _id: '$user._id',
            name: '$user.name',
            profilePhoto: '$user.profilePhoto',
            online: '$user.online',
            lastSeen: '$user.lastSeen'
          }
        }
      }
    ]);
    
    console.log('Aggregated chat list with user data:', messages.length, 'chats');
    res.json(messages);
  } catch (error) {
    console.error('Chat list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const senderObjectId = new mongoose.Types.ObjectId(userId);
    const receiverObjectId = new mongoose.Types.ObjectId(req.userId);
    
    // Mark all messages from this user as read
    const updateResult = await Message.updateMany(
      { sender: senderObjectId, receiver: receiverObjectId, read: false },
      { $set: { read: true } }
    );
    console.log('Marked as read:', updateResult.modifiedCount, 'messages');
    
    const messages = await Message.find({
      $or: [
        { sender: receiverObjectId, receiver: senderObjectId },
        { sender: senderObjectId, receiver: receiverObjectId }
      ]
    }).sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/chat/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = new mongoose.Types.ObjectId(req.userId);
    const otherUserId = new mongoose.Types.ObjectId(userId);
    
    await Message.deleteMany({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    });
    
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/block/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(req.userId);
    
    if (!currentUser.blockedUsers.includes(userId)) {
      currentUser.blockedUsers.push(userId);
      await currentUser.save();
    }
    
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/report/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const report = new Report({
      reporter: req.userId,
      reportedUser: userId,
      reason
    });
    
    await report.save();
    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/blocked-users', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('blockedUsers', 'name profilePhoto');
    res.json(user.blockedUsers || []);
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/unblock/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(req.userId);
    
    currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== userId);
    await currentUser.save();
    
    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
