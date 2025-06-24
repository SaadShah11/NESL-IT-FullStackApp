const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: {
    type: String,
    required: true,
    ref: 'User'
  },
  following: {
    type: String,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: false
});

// Indexes for efficient follower/following queries
followSchema.index({ follower: 1 }); // Query who a user follows
followSchema.index({ following: 1 }); // Query user's followers
followSchema.index({ follower: 1, following: 1 }, { unique: true }); // Compound for unique constraints

module.exports = mongoose.model('Follow', followSchema); 