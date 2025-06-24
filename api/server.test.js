const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('./server');
const seedDatabase = require('../db/scripts/seedDatabase');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('Social Network API - RBAC Tests', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    try {
      // Seed test database
      await seedDatabase();
      
      // Generate tokens for testing
      adminToken = jwt.sign({ id: 'u2', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
      userToken = jwt.sign({ id: 'u1', role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    } catch (error) {
      console.error('Test setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Clean up test data
      const User = require('../db/models/User');
      const Post = require('../db/models/Post');
      const Follow = require('../db/models/Follow');
      
      await User.deleteMany({});
      await Post.deleteMany({});
      await Follow.deleteMany({});
    } catch (error) {
      console.error('Test cleanup failed:', error);
    }
  });

  describe('POST /login', () => {
    test('should return JWT token for valid admin credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({ username: 'Bob', password: 'admin' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toEqual({ 
        id: 'u2', 
        username: 'Bob', 
        role: 'admin' 
      });
      
      // Verify token is valid JWT
      const decoded = jwt.verify(response.body.token, JWT_SECRET);
      expect(decoded.id).toBe('u2');
      expect(decoded.role).toBe('admin');
    });

    test('should return JWT token for valid user credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({ username: 'Alice', password: 'user' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toEqual({ 
        id: 'u1', 
        username: 'Alice', 
        role: 'user' 
      });
      
      // Verify token is valid JWT
      const decoded = jwt.verify(response.body.token, JWT_SECRET);
      expect(decoded.id).toBe('u1');
      expect(decoded.role).toBe('user');
    });

    test('should accept case-insensitive username', async () => {
      const response = await request(app)
        .post('/login')
        .send({ username: 'alice', password: 'user' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.username).toBe('Alice');
    });

    test('should reject invalid user credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({ username: 'Alice', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject invalid admin credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({ username: 'Bob', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/login')
        .send({ username: 'nonexistent', password: 'password' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username and password are required');
    });

    test('should reject missing password', async () => {
      const response = await request(app)
        .post('/login')
        .send({ username: 'Alice' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username and password are required');
    });

    test('should reject missing username', async () => {
      const response = await request(app)
        .post('/login')
        .send({ password: 'user' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username and password are required');
    });
  });

  describe('GET /feed', () => {
    test('should return feed for authenticated user', async () => {
      const response = await request(app)
        .get('/feed')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Check feed post structure
      if (response.body.length > 0) {
        const post = response.body[0];
        expect(post).toHaveProperty('_id');
        expect(post).toHaveProperty('content');
        expect(post).toHaveProperty('author');
        expect(post).toHaveProperty('timestamp');
        expect(post).toHaveProperty('tags');
      }
    });

    test('should return feed for authenticated admin', async () => {
      const response = await request(app)
        .get('/feed')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should support pagination with limit and offset', async () => {
      const response = await request(app)
        .get('/feed?limit=5&offset=0')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    test('should reject feed request without authentication', async () => {
      const response = await request(app).get('/feed');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing or invalid token format');
    });

    test('should reject feed request with invalid token', async () => {
      const response = await request(app)
        .get('/feed')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should return posts sorted by timestamp (newest first)', async () => {
      const response = await request(app)
        .get('/feed')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      
      if (response.body.length > 1) {
        for (let i = 0; i < response.body.length - 1; i++) {
          const currentPost = new Date(response.body[i].timestamp);
          const nextPost = new Date(response.body[i + 1].timestamp);
          expect(currentPost.getTime()).toBeGreaterThanOrEqual(nextPost.getTime());
        }
      }
    });
  });

  describe('DELETE /posts/:id - RBAC Tests', () => {
    
    // Test 1: Successful delete by admin
    test('should allow admin to delete post successfully', async () => {
      const response = await request(app)
        .delete('/posts/p1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Post deleted successfully');
      expect(response.body.deletedPost).toHaveProperty('_id', 'p1');
    });

    // Test 2: Forbidden delete by normal user
    test('should forbid normal user from deleting post', async () => {
      const response = await request(app)
        .delete('/posts/p2')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    // Test 3: Missing/invalid token scenarios
    test('should reject request with missing token', async () => {
      const response = await request(app)
        .delete('/posts/p2');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing or invalid token format');
    });

    test('should reject request with invalid token format', async () => {
      const response = await request(app)
        .delete('/posts/p2')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing or invalid token format');
    });

    test('should reject request with invalid JWT token', async () => {
      const response = await request(app)
        .delete('/posts/p2')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: 'u2', role: 'admin' }, 
        JWT_SECRET, 
        { expiresIn: '-1h' } // Expired token
      );

      const response = await request(app)
        .delete('/posts/p2')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .delete('/posts/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Post not found');
    });
  });

  describe('GET /posts', () => {
    test('should return all posts in reverse chronological order', async () => {
      const response = await request(app).get('/posts');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check if posts are sorted by creation date (newest first)
      for (let i = 0; i < response.body.length - 1; i++) {
        const currentPost = new Date(response.body[i].created);
        const nextPost = new Date(response.body[i + 1].created);
        expect(currentPost.getTime()).toBeGreaterThanOrEqual(nextPost.getTime());
      }
      
      // Check post structure
      const post = response.body[0];
      expect(post).toHaveProperty('_id');
      expect(post).toHaveProperty('author');
      expect(post).toHaveProperty('content');
      expect(post).toHaveProperty('created');
    });

    test('should handle empty posts collection gracefully', async () => {
      // This test would need a separate database setup for empty state
      // For now, we'll just verify the endpoint exists and returns array
      const response = await request(app).get('/posts');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /users/:userId/timeline', () => {
    test('should return timeline for authenticated user', async () => {
      const response = await request(app)
        .get('/users/u1/timeline')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Check timeline post structure
      if (response.body.length > 0) {
        const timelinePost = response.body[0];
        expect(timelinePost).toHaveProperty('_id');
        expect(timelinePost).toHaveProperty('content');
        expect(timelinePost).toHaveProperty('created');
        expect(timelinePost).toHaveProperty('authorName');
      }
    });

    test('should return timeline for authenticated admin', async () => {
      const response = await request(app)
        .get('/users/u2/timeline')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should reject timeline request without authentication', async () => {
      const response = await request(app).get('/users/u1/timeline');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing or invalid token format');
    });

    test('should reject timeline request with invalid token', async () => {
      const response = await request(app)
        .get('/users/u1/timeline')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should handle timeline for user with no followings', async () => {
      const response = await request(app)
        .get('/users/u2/timeline')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Timeline might be empty if user doesn't follow anyone
    });
  });

  describe('Authentication Middleware Tests', () => {
    test('should reject requests with malformed Authorization header', async () => {
      const response = await request(app)
        .delete('/posts/p1')
        .set('Authorization', 'Malformed token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing or invalid token format');
    });

    test('should reject requests with empty Authorization header', async () => {
      const response = await request(app)
        .delete('/posts/p1')
        .set('Authorization', '');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing or invalid token format');
    });

    test('should reject requests with Bearer but no token', async () => {
      const response = await request(app)
        .delete('/posts/p1')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing or invalid token format');
    });

    test('should reject requests with token signed with wrong secret', async () => {
      const wrongToken = jwt.sign({ id: 'u2', role: 'admin' }, 'wrong-secret', { expiresIn: '1h' });
      
      const response = await request(app)
        .delete('/posts/p1')
        .set('Authorization', `Bearer ${wrongToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('Role-Based Authorization Tests', () => {
    test('should allow user role to access timeline endpoint', async () => {
      const response = await request(app)
        .get('/users/u1/timeline')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });

    test('should allow admin role to access timeline endpoint', async () => {
      const response = await request(app)
        .get('/users/u1/timeline')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('should allow user role to access feed endpoint', async () => {
      const response = await request(app)
        .get('/feed')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });

    test('should allow admin role to access feed endpoint', async () => {
      const response = await request(app)
        .get('/feed')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('should only allow admin role to delete posts', async () => {
      // User should be forbidden
      const userResponse = await request(app)
        .delete('/posts/p2')
        .set('Authorization', `Bearer ${userToken}`);

      expect(userResponse.status).toBe(403);
      expect(userResponse.body.error).toBe('Insufficient permissions');

      // Admin should be allowed (if post exists)
      const adminResponse = await request(app)
        .delete('/posts/p2')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should be either 200 (deleted) or 404 (not found), but not 403 (forbidden)
      expect([200, 404]).toContain(adminResponse.status);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle server errors gracefully', async () => {
      // Test with invalid ObjectId format (if applicable)
      const response = await request(app)
        .delete('/posts/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle database connection issues gracefully', async () => {
      // This is hard to test without actually disconnecting DB
      // But we can test that endpoints return proper error structure
      const response = await request(app).get('/posts');
      
      // Should either succeed or fail gracefully
      expect([200, 500]).toContain(response.status);
      if (response.status === 500) {
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Input Validation Tests', () => {
    test('should handle missing request body for login', async () => {
      const response = await request(app)
        .post('/login')
        .send();

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username and password are required');
    });

    test('should handle non-JSON request body', async () => {
      const response = await request(app)
        .post('/login')
        .send('invalid json');

      expect([400]).toContain(response.status);
    });
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
      
      // Verify timestamp is recent (within last minute)
      const timestampAge = Date.now() - new Date(response.body.timestamp).getTime();
      expect(timestampAge).toBeLessThan(60000); // Less than 1 minute
    });
  });
}); 