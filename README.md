# NESL-IT FullStack Social Network Application

A complete fullstack social network application built with MongoDB, Express.js, React, and Node.js (MERN stack) featuring authentication, infinite scroll feed, and optimized database operations.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Schema Design & Indexing Strategy](#schema-design--indexing-strategy)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Testing Commands & Results](#testing-commands--results)
- [API Documentation](#api-documentation)
- [Features](#features)
- [Project Structure](#project-structure)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Express API   │    │   MongoDB DB    │
│   (Port 5173)    │◄──►│   (Port 3000)   │◄──►│   (Port 27017)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                         │                         │
   ┌───▼───┐                ┌───▼───┐                ┌───▼───┐
   │ Vite  │                │ CORS  │                │ Models│
   │Router │                │ JWT   │                │Indexes│
   │Cache  │                │ Auth  │                │Aggreg │
   └───────┘                └───────┘                └───────┘
```

## Schema Design & Indexing Strategy

### Database Schema Design

#### 1. Users Collection
```javascript
// db/models/User.js
{
  _id: String,        // Custom ID (u1, u2)
  name: String,       // Display name (Alice, Bob)
  role: String,       // Enum: ['user', 'admin']
  password: String,   // Plain text (demo only)
  joined: Date        // Account creation date
}
```

**Indexes:**
- `{ name: 1 }` - For username lookups during login
- `{ joined: 1 }` - For user analytics queries

#### 2. Posts Collection
```javascript
// db/models/Post.js
{
  _id: String,        // Custom ID (p1, p2, p3...)
  author: String,     // Reference to User._id
  content: String,    // Post text content
  created: Date       // Post creation timestamp
}
```

**Indexes:**
- `{ created: -1 }` - Primary index for global timeline (newest first)
- `{ author: 1, created: -1 }` - Compound index for user's posts timeline
- `{ author: 1 }` - For author-specific queries

#### 3. Follows Collection
```javascript
// db/models/Follow.js
{
  follower: String,   // User._id who follows
  following: String   // User._id being followed
}
```

**Indexes:**
- `{ follower: 1 }` - Find who a user follows (primary feed query)
- `{ following: 1 }` - Find a user's followers
- `{ follower: 1, following: 1 }` - Compound unique index to prevent duplicates

### Indexing Strategy Rationale

#### Performance Optimization:
1. **Timeline Queries**: `{ created: -1 }` enables O(log n) sorting instead of O(n log n)
2. **User Feed**: `{ follower: 1 }` allows instant lookup of followed users
3. **Author Posts**: `{ author: 1, created: -1 }` optimizes user profile views
4. **Login Lookup**: `{ name: 1 }` enables fast username-based authentication

#### Query Pattern Analysis:
- **Most Frequent**: Feed generation (follower → following → posts)
- **Critical Path**: Login authentication by username
- **Bulk Operations**: Timeline sorting by creation date
- **Data Integrity**: Unique constraints on follow relationships

#### Memory & Storage Impact:
- **Index Size**: ~5-10% of collection size overhead
- **Write Performance**: Slight decrease due to index maintenance
- **Read Performance**: 10-100x improvement for indexed queries
- **Disk Usage**: Justified by query performance gains

## Installation & Setup

### Prerequisites
- **Node.js** 16+ and npm
- **MongoDB** 4.4+ (or Docker)
- **Git** for cloning

### 1. Clone Repository
```bash
git clone <repository-url>
cd "NESL-IT FullStackApp"
```

### 2. MongoDB Setup (Choose Option A or B)

#### Option A: Docker (Recommended)
```bash
# Start MongoDB container
docker run -d --name social-network-mongo -p 27017:27017 mongo:latest

# Verify MongoDB is running
docker ps
```

#### Option B: Local MongoDB
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod --dbpath /path/to/data/directory
```

### 3. Database Setup
```bash
# Navigate to database folder
cd db

# Install dependencies
npm install

# Seed the database with sample data
npm run seed
```

### 4. API Setup
```bash
# Navigate to API folder
cd ../api

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Frontend Setup
```bash
# Navigate to web folder (new terminal)
cd ../web

# Install dependencies
npm install

# Start development server
npm run dev
```

## Running the Application

### Development Mode

#### 1. Start MongoDB
```bash
# Docker
docker start social-network-mongo

# Or local MongoDB
mongod --dbpath /your/data/path
```

#### 2. Start API Server
```bash
cd api
npm run dev
# Output: Server running on port 3000
```

#### 3. Start Frontend
```bash
cd web
npm run dev
# Output: Local: http://localhost:5173
```

#### 4. Access Application
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **MongoDB**: mongodb://localhost:27017

### Production Mode

#### 1. Build Frontend
```bash
cd web
npm run build
npm run preview
```

#### 2. Start API in Production
```bash
cd api
npm start
```

### Demo Credentials
- **User**: username="Alice", password="user"
- **Admin**: username="Bob", password="admin"

## Testing Commands & Results

### Unit Testing

#### 1. API Tests
```bash
cd api
npm test
```
**Expected Output:**
```
✓ POST /login with valid user credentials
✓ POST /login with invalid credentials returns 401
✓ DELETE /posts/:id as admin user
✓ DELETE /posts/:id as regular user returns 403
✓ DELETE /posts/:id with invalid token returns 401
✓ GET /feed requires authentication
✓ GET /health returns status

Tests: 43 passed, 0 failed
```

### Frontend Testing

#### 1. Login Flow Test
1. **Navigate** to http://localhost:5173
2. **Enter** username="Alice", password="user"
3. **Click** "Sign In"
4. **Verify** redirect to feed page
5. **Check** "Welcome, Alice (user)" in header

#### 2. Feed Functionality Test
1. **Alice Login**: Should see Alice's posts + Bob's posts (Alice follows Bob)
2. **Bob Login**: Should see only Bob's posts (Bob follows nobody)
3. **Infinite Scroll**: Scroll to bottom should load more posts
4. **Logout**: Should return to login page

#### 3. Admin Features Test
1. **Login as Bob** (admin)
2. **Verify** delete buttons (×) appear on posts
3. **Click delete button**: Should do nothing (functionality disabled per requirements)

## API Documentation

### Authentication Endpoints

#### POST /login
- **Description**: Authenticate user and return JWT token
- **Body**: `{ "username": string, "password": string }`
- **Response**: `{ "token": string, "user": object }`
- **Status Codes**: 200 (success), 401 (invalid credentials), 400 (missing fields)

### Feed Endpoints

#### GET /feed
- **Description**: Get paginated posts for authenticated user
- **Headers**: `Authorization: Bearer <token>`
- **Query Params**: `?limit=10&offset=0`
- **Response**: Array of post objects
- **Status Codes**: 200 (success), 401 (unauthorized), 500 (server error)

### Admin Endpoints

#### DELETE /posts/:id
- **Description**: Delete a post (admin only)
- **Headers**: `Authorization: Bearer <token>`
- **Params**: `id` - Post ID to delete
- **Response**: `{ "message": string, "deletedPost": object }`
- **Status Codes**: 200 (success), 403 (forbidden), 404 (not found), 401 (unauthorized)

### Utility Endpoints

#### GET /health
- **Description**: API health check
- **Response**: `{ "status": "OK", "timestamp": string }`
- **Status Codes**: 200 (always)

## Features

### 🔐 Authentication
- **JWT-based authentication** with role-based access control
- **Case-insensitive login** with username validation
- **In-memory token storage** for security
- **Automatic token expiration** handling

### 📱 Frontend
- **React SPA** with Vite build system
- **Infinite scroll feed** with intersection observer
- **Custom useApi hook** with caching and error handling
- **Optimized rendering** with React.memo
- **Responsive design** with modern UI

### 🛠 Backend
- **RESTful API** with Express.js
- **MongoDB integration** with Mongoose
- **CORS enabled** for cross-origin requests
- **Error handling** with meaningful messages
- **Request logging** and debugging

### 📊 Database
- **Optimized schemas** with proper indexing
- **Aggregation pipelines** for complex queries
- **Efficient follow system** with O(log n) lookups
- **Data seeding** for development and testing

### 🚀 Performance
- **Database-level sorting** instead of in-memory
- **Pagination** for large datasets
- **Request caching** to reduce API calls
- **Optimized indexes** for common query patterns

## Project Structure

```
NESL-IT FullStackApp/
├── README.md                     # This file
├── api/                          # Express.js backend
│   ├── server.js                 # Main server file
│   ├── server.test.js            # API tests
│   ├── package.json              # Backend dependencies
│   └── jest.setup.js             # Test configuration
├── db/                           # Database layer
│   ├── models/                   # Mongoose models
│   │   ├── User.js               # User schema
│   │   ├── Post.js               # Post schema
│   │   └── Follow.js             # Follow relationship schema
│   ├── config/                   # Database configuration
│   │   └── database.js           # MongoDB connection
│   ├── scripts/                  # Database utilities
│   │   └── seedDatabase.js       # Sample data seeding
│   ├── aggregation.js            # MongoDB aggregation pipelines
│   ├── schemas.js                # Schema definitions
│   ├── indexing-strategy.md      # Index documentation
│   └── package.json              # Database dependencies
├── web/                          # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── Login.jsx         # Authentication form
│   │   │   ├── Feed.jsx          # Main feed component
│   │   │   └── PostItem.jsx      # Individual post component
│   │   ├── contexts/             # React contexts
│   │   │   └── AuthContext.jsx   # Authentication state
│   │   ├── hooks/                # Custom hooks
│   │   │   └── useApi.js         # API interaction hook
│   │   ├── App.jsx               # Root component
│   │   └── main.jsx              # React entry point
│   ├── index.html                # HTML template
│   ├── vite.config.js            # Vite configuration
│   └── package.json              # Frontend dependencies
└── debug/                        # Analysis and debugging
    └── code-analysis.md          # Code review and optimization analysis
```
