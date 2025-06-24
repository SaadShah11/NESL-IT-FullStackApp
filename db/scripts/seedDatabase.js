const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');

const connectDB = require('../config/database');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database (will check if already connected)
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Follow.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create users (matching the original specification)
    const users = [
      { _id: "u1", name: "Alice", role: "user", password: "user", joined: new Date("2024-01-15T09:00Z") },
      { _id: "u2", name: "Bob", role: "admin", password: "admin", joined: new Date("2024-02-02T12:30Z") }
    ];

    await User.insertMany(users);
    console.log('✅ Created users');

    // Create follow relationships
    const follows = [
      { follower: "u1", following: "u2" }
    ];

    await Follow.insertMany(follows);
    console.log('✅ Created follow relationships');

    // Create posts
    const posts = [
      { _id: "p1", author: "u2", content: "Hello!", created: new Date("2024-03-10T18:00Z") },
      { _id: "p2", author: "u1", content: "Hey Bob", created: new Date("2024-03-11T09:15Z") }
    ];

    await Post.insertMany(posts);
    console.log('✅ Created posts');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Seeded data summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Posts: ${posts.length}`);
    console.log(`- Follow relationships: ${follows.length}`);
    
    console.log('\n🔐 Test credentials:');
    console.log('- User: id="u1", password="user", role="user"');
    console.log('- Admin: id="u2", password="admin", role="admin"');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    // Only close connection and exit if running as main module (not during tests)
    if (require.main === module) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
      process.exit(0);
    }
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase; 