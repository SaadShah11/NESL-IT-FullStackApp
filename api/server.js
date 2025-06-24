const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const connectDB = require('../db/config/database');

// Import models
const User = require('../db/models/User');
const Post = require('../db/models/Post');
const Follow = require('../db/models/Follow');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Custom authorization middleware
function authorize(roles) {
  return (req, res, next) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid token format' });
      }

      const token = authHeader.split(' ')[1];
      
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if user role is authorized
      if (!roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Add user info to request object
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`Login attempt for username: "${username}"`);

    // Validate input
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username (name field) - case insensitive
    const user = await User.findOne({ 
      name: { $regex: new RegExp(`^${username.trim()}$`, 'i') } 
    });
    
    if (!user) {
      console.log(`User not found for username: "${username}"`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`User found: ${user.name} (${user._id})`);

    // Check password (for simplicity, we'll use plain text comparison for the hard-coded users)
    // In production, you'd use bcrypt.compare() for hashed passwords
    const isValidPassword = password === user.password;
    if (!isValidPassword) {
      console.log(`Invalid password for user: ${user.name}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`Login successful for user: ${user.name}`);

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      token,
      user: { id: user._id, username: user.name, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected DELETE /posts/:id endpoint (only admins can delete)
app.delete('/posts/:id', authorize(['admin']), async (req, res) => {
  try {
    const postId = req.params.id;
    
    // Find and delete post from database
    const deletedPost = await Post.findByIdAndDelete(postId);
    if (!deletedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ 
      message: 'Post deleted successfully',
      deletedPost 
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's following timeline (using the aggregation pipeline from db folder)
app.get('/users/:userId/timeline', authorize(['user', 'admin']), async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Use aggregation pipeline from db folder
    const { getFollowingsPosts } = require('../db/aggregation');
    const timeline = await getFollowingsPosts(userId);

    res.json(timeline);
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get feed for authenticated user with pagination
app.get('/feed', authorize(['user', 'admin']), async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    // Get current user info
    const currentUser = await User.findById(userId);
    
    // Debug: Check who this user follows
    const followRelationships = await Follow.find({ follower: userId });
    console.log(`DEBUG: User ${userId} follows:`, followRelationships);
    
    // Get user's own posts
    const userPosts = await Post.find({ author: userId }).sort({ created: -1 });
    
    // Get list of users this user follows
    const follows = await Follow.find({ follower: userId });
    const followingUserIds = follows.map(follow => follow.following);
    
    // Get posts from followed users
    const followingPosts = await Post.find({ 
      author: { $in: followingUserIds } 
    }).sort({ created: -1 });
    
    console.log(`DEBUG: User ${userId} follows ${followingUserIds.length} users: ${followingUserIds}, found ${followingPosts.length} posts`);
    
    // Format user's own posts
    const userPostsFormatted = userPosts.map(post => ({
      _id: post._id,
      content: post.content,
      author: currentUser ? currentUser.name : 'You',
      timestamp: post.created,
      tags: post.tags || []
    }));
    
    // Format posts from followed users (need to get author names)
    const followingPostsFormatted = await Promise.all(
      followingPosts.map(async (post) => {
        const author = await User.findById(post.author);
        return {
          _id: post._id,
          content: post.content,
          author: author ? author.name : 'Unknown User',
          timestamp: post.created,
          tags: post.tags || []
        };
      })
    );
    
    // Combine user's posts with posts from followed users
    const allPosts = [...userPostsFormatted, ...followingPostsFormatted];
    
    // Sort all posts by date (newest first)
    allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const paginatedPosts = allPosts.slice(offset, offset + limit);
    
    console.log(`Feed for ${userId}: ${userPostsFormatted.length} own posts + ${followingPostsFormatted.length} from followed users = ${allPosts.length} total, returning ${paginatedPosts.length} posts`);
    
    res.json(paginatedPosts);
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all posts (for testing)
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ created: -1 });
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; 