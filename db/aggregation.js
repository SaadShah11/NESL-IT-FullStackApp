// Aggregation Pipeline: Get 10 most recent posts from user's followings
// Returns posts with content, created date, and author name

const Follow = require('./models/Follow');

/**
 * Get the 10 most recent posts from users that the given user follows
 * @param {string} userId - The user ID to get timeline for
 * @returns {Promise<Array>} Array of posts with content, created, and authorName
 */
const getFollowingsPosts = async (userId) => {
  return await Follow.aggregate([
    // Step 1: Find who the user follows
    {
      $match: { follower: userId }
    },
    
    // Step 2: Lookup posts from those users they follow
    {
      $lookup: {
        from: "posts",
        localField: "following",
        foreignField: "author",
        as: "posts"
      }
    },
    
    // Step 3: Unwind the posts array
    {
      $unwind: "$posts"
    },
    
    // Step 4: Lookup author details
    {
      $lookup: {
        from: "users",
        localField: "following",
        foreignField: "_id",
        as: "authorDetails"
      }
    },
    
    // Step 5: Unwind author details
    {
      $unwind: "$authorDetails"
    },
    
    // Step 6: Project required fields
    {
      $project: {
        _id: "$posts._id",
        content: "$posts.content",
        created: "$posts.created",
        authorName: "$authorDetails.name"
      }
    },
    
    // Step 7: Sort by created date (newest first)
    {
      $sort: { created: -1 }
    },
    
    // Step 8: Limit to 10 most recent posts
    {
      $limit: 10
    }
  ]);
};

module.exports = { getFollowingsPosts }; 