const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  interestIn: {
    type: String,
    enum: ['Male', 'Female', 'Both'],
    default: 'Female'
  },
  photos: [{
    type: String
  }],
  profilePhoto: {
    type: String
  },
  height: {
    type: Number
  },
  graduation: {
    type: String
  },
  privacy: {
    showOnline: { type: Boolean, default: true },
    showDistance: { type: Boolean, default: true },
    allowMessages: { type: Boolean, default: true }
  },
  age: {
    type: Number,
    required: true,
    min: 18
  },
  bio: {
    type: String
  },
  contacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
