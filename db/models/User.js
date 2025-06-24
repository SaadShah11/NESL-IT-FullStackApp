const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: true
  },
  joined: {
    type: Date,
    default: Date.now
  }
}, {
  _id: false, // Disable automatic _id generation since we're using custom _id
  timestamps: false
});

// Index for efficient queries
userSchema.index({ name: 1 });
userSchema.index({ joined: 1 });

module.exports = mongoose.model('User', userSchema); 