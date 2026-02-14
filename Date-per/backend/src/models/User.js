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
  bodyType: {
    type: String,
    enum: ['Slim', 'Athletic', 'Average', 'Curvy', '']
  },
  eyeColor: {
    type: String
  },
  hairColor: {
    type: String
  },
  smoking: {
    type: String,
    enum: ['Never', 'Occasionally', 'Regularly', '']
  },
  drinking: {
    type: String,
    enum: ['Never', 'Socially', 'Regularly', '']
  },
  exercise: {
    type: String,
    enum: ['Never', 'Sometimes', 'Often', 'Daily', '']
  },
  diet: {
    type: String,
    enum: ['Anything', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', '']
  },
  graduation: {
    type: String
  },
  occupation: {
    type: String
  },
  company: {
    type: String
  },
  school: {
    type: String
  },
  hometown: {
    type: String
  },
  currentCity: {
    type: String
  },
  interests: [{
    type: String
  }],
  languages: [{
    type: String
  }],
  lookingFor: {
    type: String,
    enum: ['Relationship', 'Friendship', 'Casual', 'Not Sure', '']
  },
  relationshipStatus: {
    type: String,
    enum: ['Single', 'Divorced', 'Widowed', '']
  },
  kids: {
    type: String,
    enum: ['Don\'t have', 'Have kids', 'Want kids', 'Don\'t want kids', '']
  },
  instagram: {
    type: String
  },
  verified: {
    type: Boolean,
    default: false
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
    type: String,
    default: ''
  },
  online: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  coins: {
    type: Number,
    default: 100
  },
  lastSpinTime: {
    type: Date,
    default: null
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
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  deletionScheduledAt: {
    type: Date,
    default: null
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
