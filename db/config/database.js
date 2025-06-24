const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    // Check if connecting
    if (mongoose.connection.readyState === 2) {
      console.log('MongoDB connection in progress...');
      // Wait for connection to complete
      await new Promise(resolve => {
        mongoose.connection.once('connected', resolve);
      });
      return;
    }

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social_network';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully');
    
    // Create indexes on connection
    await createIndexes();
    
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Don't exit in test environment
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const createIndexes = async () => {
  try {
    const User = require('../models/User');
    const Post = require('../models/Post');
    const Follow = require('../models/Follow');

    // Ensure indexes are created
    await User.createIndexes();
    await Post.createIndexes();
    await Follow.createIndexes();

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error.message);
  }
};

module.exports = connectDB; 