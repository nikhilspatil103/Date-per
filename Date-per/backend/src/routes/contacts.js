const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId).populate('contacts');
    if (!currentUser || !currentUser.contacts || currentUser.contacts.length === 0) {
      return res.json([]);
    }
    
    const userLat = currentUser.location?.coordinates[1] || 0;
    const userLng = currentUser.location?.coordinates[0] || 0;
    
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
    
    const formattedContacts = currentUser.contacts.map(contact => {
      const contactLat = contact.location?.coordinates[1] || 0;
      const contactLng = contact.location?.coordinates[0] || 0;
      const distanceKm = calculateDistance(userLat, userLng, contactLat, contactLng);
      const distance = distanceKm > 0 ? `${Math.round(distanceKm)} km away` : 'Nearby';
      
      return {
        _id: contact._id,
        name: contact.name,
        email: contact.email,
        photo: contact.profilePhoto,
        age: contact.age || 25,
        gender: contact.gender,
        distance,
        status: contact.bio || "I'm free to chat!",
        bio: contact.bio || "I'm free to chat!",
        online: contact.online || false,
        lastSeen: contact.lastSeen
      };
    });

    res.json(formattedContacts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/add', auth, async (req, res) => {
  try {
    const { contactId } = req.body;
    if (!contactId) {
      return res.status(400).json({ message: 'Contact ID required' });
    }

    const user = await User.findById(req.userId);
    if (!user.contacts.includes(contactId)) {
      user.contacts.push(contactId);
      await user.save();
    }

    res.json({ message: 'Contact added', contacts: user.contacts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/remove', auth, async (req, res) => {
  try {
    const { contactId } = req.body;
    if (!contactId) {
      return res.status(400).json({ message: 'Contact ID required' });
    }

    const user = await User.findById(req.userId);
    user.contacts = user.contacts.filter(id => id.toString() !== contactId);
    await user.save();

    res.json({ message: 'Contact removed', contacts: user.contacts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
