const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true,
    ref: 'User'
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  created: {
    type: Date,
    default: Date.now
  }
}, {
  _id: false, // Disable automatic _id generation since we're using custom _id
  timestamps: false
});

// Indexes for efficient queries
postSchema.index({ created: -1 }); // Global timeline, newest first
postSchema.index({ author: 1, created: -1 }); // User's posts, newest first

module.exports = mongoose.model('Post', postSchema); 