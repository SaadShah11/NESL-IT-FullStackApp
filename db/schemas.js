// Collection Schemas Design for Social Network Analytics
// Designed for efficient follower queries and reverse-chronological post paging

// Users Collection Schema
// - Custom _id (String): Efficient user lookup and referencing
// - name, role, password, joined: Core user attributes
// - Indexes: { name: 1 }, { joined: 1 } for user queries

// Follows Collection Schema  
// - follower, following (String refs): Denormalized for fast relationship queries
// - Indexes: { follower: 1 }, { following: 1 }, { follower: 1, following: 1 } (unique)
// - Enables efficient "who follows X" and "who does X follow" queries

// Posts Collection Schema
// - Custom _id, author (ref), content, created: Essential post data
// - Indexes: { created: -1 }, { author: 1, created: -1 } for timeline performance
// - Supports fast reverse-chronological sorting and user-specific post queries 