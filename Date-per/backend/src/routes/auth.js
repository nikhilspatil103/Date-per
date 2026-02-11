const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, age, gender, interestIn } = req.body;

    if (!email || !password || !name || !age || !gender || !interestIn) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (age < 18) {
      return res.status(400).json({ message: 'You must be at least 18 years old' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = new User({ email, password, name, age, gender, interestIn, online: true });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.status(201).json({
      token,
      userId: user._id,
      email: user.email,
      name: user.name,
      age: user.age,
      gender: user.gender,
      interestIn: user.interestIn
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set user online on login
    user.online = true;
    user.lastSeen = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.json({
      token,
      userId: user._id,
      email: user.email,
      name: user.name,
      online: user.online,
      gender: user.gender,
      interestIn: user.interestIn,
      photos: user.photos,
      profilePhoto: user.profilePhoto,
      height: user.height,
      graduation: user.graduation,
      privacy: user.privacy,
      age: user.age,
      bio: user.bio
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({
      ...user.toObject(),
      likesCount: user.likedBy?.length || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { name, gender, interestIn, photos, profilePhoto, height, graduation, privacy, age, bio, location } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (gender) updateData.gender = gender;
    if (interestIn) updateData.interestIn = interestIn;
    if (photos !== undefined) {
      console.log('Updating photos, count:', photos.length);
      updateData.photos = photos;
    }
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;
    if (height) updateData.height = height;
    if (graduation) updateData.graduation = graduation;
    if (privacy) updateData.privacy = privacy;
    if (age) updateData.age = age;
    if (bio) updateData.bio = bio;
    if (location && location.lat && location.lng) {
      updateData.location = {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      };
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Updated user photos count:', user.photos?.length || 0);
    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
