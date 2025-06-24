// Jest setup file for test environment configuration
const mongoose = require('mongoose');

// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/social_network_test';

// Global setup for all tests
beforeAll(async () => {
  // Ensure clean slate
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

// Global cleanup after all tests
afterAll(async () => {
  try {
    // Close any remaining connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  } catch (error) {
    console.error('Jest cleanup error:', error);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Suppress console.log during tests (optional - comment out if you want to see logs)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: console.error, // Keep errors visible
// }; 