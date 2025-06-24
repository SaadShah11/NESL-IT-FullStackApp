# MongoDB Troubleshooting Guide

## 🚨 Error: `ECONNREFUSED ::1:27018, connect ECONNREFUSED 127.0.0.1:27018`

This error means MongoDB is **not running** on port 27018.

## 🔍 **Step 1: Check if MongoDB is running**

### Windows:
```cmd
# Check if MongoDB process is running
tasklist | findstr mongod

# Check what's running on port 27018
netstat -an | findstr :27018
```

### Mac/Linux:
```bash
# Check if MongoDB process is running
ps aux | grep mongod

# Check what's running on port 27018
lsof -i :27018
# or
netstat -an | grep 27018
```

## 🚀 **Step 2: Start MongoDB on Port 27018**

### Option A: Quick Docker Solution (Recommended)
```bash
# Stop any existing container
docker stop social-network-mongo 2>/dev/null
docker rm social-network-mongo 2>/dev/null

# Start new MongoDB container on port 27018
docker run -d --name social-network-mongo \
  -p 27018:27017 \
  mongo:latest

# Verify it's running
docker ps | grep social-network-mongo
```

### Option B: Local MongoDB Installation
```bash
# Windows
mongod --port 27018 --dbpath C:\data\db

# Mac/Linux
mongod --port 27018 --dbpath /usr/local/var/mongodb
```

### Option C: MongoDB as Windows Service
```cmd
# Stop default MongoDB service (if running)
net stop MongoDB

# Start with custom config
mongod --config "C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg" --port 27018
```

## 🧪 **Step 3: Test Connection**

```bash
# Test with mongo shell
mongo --port 27018

# Or test with mongosh (newer versions)
mongosh --port 27018
```

## 🔧 **Step 4: Alternative - Use Different Port**

If you have MongoDB running on a different port, update the config:

```bash
# Find what port your MongoDB is running on
# Windows:
netstat -an | findstr :27017

# Mac/Linux:
lsof -i | grep mongo
```

Then set environment variable:
```bash
# If your MongoDB is on port 27017
export MONGODB_URI="mongodb://localhost:27017/social_network"

# Or create .env file in api folder
echo "MONGODB_URI=mongodb://localhost:27017/social_network" > api/.env
```

## 💡 **Common Issues & Solutions**

### Issue: MongoDB not installed
**Solution**: Install MongoDB Community Edition
- **Windows**: Download from MongoDB website
- **Mac**: `brew install mongodb-community`
- **Linux**: Use package manager (apt/yum)

### Issue: Permission denied
**Solution**: 
```bash
# Create data directory with proper permissions
sudo mkdir -p /data/db
sudo chown -R $USER /data/db
```

### Issue: Port already in use
**Solution**: Use a different port
```bash
# Try port 27019 instead
mongod --port 27019
```

## 🎯 **Quick Success Test**

Once MongoDB is running, verify with:
```bash
cd api
npm run seed
```

You should see:
```
🌱 Starting database seeding...
MongoDB connected successfully
Database indexes created successfully
✅ Created users
✅ Created follow relationships
✅ Created posts
🎉 Database seeding completed successfully!
``` 