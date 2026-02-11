const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
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
      }
    ]);
    
    console.log('Aggregated chat list:', messages.length, 'chats');
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

module.exports = router;
