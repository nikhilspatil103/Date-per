const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, age, gender, interestIn, bio } = req.body;

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

    const user = new User({ email, password, name, age, gender, interestIn, bio: bio || '', online: true });
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
      interestIn: user.interestIn,
      bio: user.bio
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
      likesCount: user.likedBy?.length || 0,
      deletionScheduledAt: user.deletionScheduledAt,
      coins: user.coins || 100
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { name, gender, interestIn, photos, profilePhoto, height, graduation, privacy, age, bio, location, bodyType, eyeColor, hairColor, smoking, drinking, exercise, diet, occupation, company, school, hometown, currentCity, interests, languages, lookingFor, relationshipStatus, kids, instagram } = req.body;
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
    if (graduation !== undefined) updateData.graduation = graduation;
    if (privacy) updateData.privacy = privacy;
    if (age) updateData.age = age;
    if (bio !== undefined) updateData.bio = bio;
    if (bodyType !== undefined) updateData.bodyType = bodyType;
    if (eyeColor !== undefined) updateData.eyeColor = eyeColor;
    if (hairColor !== undefined) updateData.hairColor = hairColor;
    if (smoking !== undefined) updateData.smoking = smoking;
    if (drinking !== undefined) updateData.drinking = drinking;
    if (exercise !== undefined) updateData.exercise = exercise;
    if (diet !== undefined) updateData.diet = diet;
    if (occupation !== undefined) updateData.occupation = occupation;
    if (company !== undefined) updateData.company = company;
    if (school !== undefined) updateData.school = school;
    if (hometown !== undefined) updateData.hometown = hometown;
    if (currentCity !== undefined) updateData.currentCity = currentCity;
    if (interests !== undefined) updateData.interests = interests;
    if (languages !== undefined) updateData.languages = languages;
    if (lookingFor !== undefined) updateData.lookingFor = lookingFor;
    if (relationshipStatus !== undefined) updateData.relationshipStatus = relationshipStatus;
    if (kids !== undefined) updateData.kids = kids;
    if (instagram !== undefined) updateData.instagram = instagram;
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

router.delete('/account', auth, async (req, res) => {
  try {
    const { reason, feedback } = req.body;
    const Feedback = require('../models/Feedback');
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Save feedback
    await Feedback.create({
      userId: req.userId,
      email: user.email,
      reason,
      feedback: feedback || ''
    });

    // Schedule deletion for 24 hours from now
    const deletionDate = new Date();
    deletionDate.setHours(deletionDate.getHours() + 24);
    
    user.deletionScheduledAt = deletionDate;
    await user.save();
    
    res.json({ 
      message: 'Account deletion scheduled', 
      deletionDate: deletionDate.toISOString() 
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/cancel-deletion', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.deletionScheduledAt = null;
    await user.save();
    
    res.json({ message: 'Account deletion cancelled' });
  } catch (error) {
    console.error('Cancel deletion error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { email, name, photo } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: 'Email and name required' });
    }

    let user = await User.findOne({ email });
    
    if (user) {
      user.online = true;
      user.lastSeen = new Date();
      if (photo && !user.profilePhoto) user.profilePhoto = photo;
      await user.save();

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
      });

      return res.json({
        token,
        userId: user._id,
        email: user.email,
        name: user.name,
        profilePhoto: user.profilePhoto,
        gender: user.gender,
        interestIn: user.interestIn,
        age: user.age,
        bio: user.bio,
        isNewUser: false
      });
    }

    user = new User({
      email,
      name,
      password: Math.random().toString(36).slice(-8),
      age: 18,
      gender: 'Male',
      interestIn: 'Female',
      profilePhoto: photo,
      online: true
    });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.json({
      token,
      userId: user._id,
      email: user.email,
      name: user.name,
      profilePhoto: user.profilePhoto,
      isNewUser: true
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
