# 📝 Command Reference - Supply Chain Network Analysis

Quick reference for all commands needed to run and manage the application.

---

## 🚀 Installation Commands

### Initial Setup
```bash
# Navigate to project
cd d:/CODE/HI/supply-chain-social-network

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Create environment file
copy .env.example .env
```

---

## 🗄️ MongoDB Commands

### Windows
```bash
# Start MongoDB service
net start MongoDB

# Stop MongoDB service
net stop MongoDB

# Check MongoDB status
sc query MongoDB

# Start MongoDB manually
mongod

# Connect to MongoDB shell
mongo
mongosh  # For MongoDB 6+
```

### MongoDB Shell Commands
```javascript
// Show databases
show dbs

// Use supply chain database
use supply-chain-network

// Show collections
show collections

// Count nodes
db.nodes.countDocuments()

// Count routes
db.routes.countDocuments()

// Find all nodes
db.nodes.find().pretty()

// Clear all nodes
db.nodes.deleteMany({})

// Clear all routes
db.routes.deleteMany({})

// Drop database
db.dropDatabase()
```

---

## 🏃 Running the Application

### Development Mode

**Option 1: Separate Terminals**
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

**Option 2: Concurrent (if configured)**
```bash
# Run both backend and frontend
npm run dev:full
```

### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Serve production build
npm start
```

---

## 🧪 Testing Commands

### Backend API Testing

**Health Check**
```bash
curl http://localhost:5000/api/health
```

**Get All Nodes**
```bash
curl http://localhost:5000/api/nodes
```

**Get All Routes**
```bash
curl http://localhost:5000/api/routes
```

**Get Analytics Metrics**
```bash
curl http://localhost:5000/api/analytics/metrics
```

**Get Network Health**
```bash
curl http://localhost:5000/api/analytics/network-health
```

**Get Bottlenecks**
```bash
curl http://localhost:5000/api/analytics/bottlenecks
```

**Get Critical Nodes**
```bash
curl http://localhost:5000/api/analytics/critical-nodes
```

**Simulate Node Disruption**
```bash
curl -X POST http://localhost:5000/api/analytics/simulate-disruption \
  -H "Content-Type: application/json" \
  -d "{\"nodeId\": \"N1\"}"
```

**Simulate Route Disruption**
```bash
curl -X POST http://localhost:5000/api/analytics/simulate-disruption \
  -H "Content-Type: application/json" \
  -d "{\"edgeSource\": \"N1\", \"edgeTarget\": \"N2\"}"
```

**Find Alternative Paths**
```bash
curl -X POST http://localhost:5000/api/analytics/find-paths \
  -H "Content-Type: application/json" \
  -d "{\"source\": \"N1\", \"target\": \"N5\", \"maxPaths\": 5}"
```

**Upload Nodes (with file)**
```bash
curl -X POST http://localhost:5000/api/upload/nodes \
  -F "file=@sample-data/nodes.csv"
```

**Upload Routes (with file)**
```bash
curl -X POST http://localhost:5000/api/upload/routes \
  -F "file=@sample-data/routes.csv"
```

**Clear All Data**
```bash
curl -X DELETE http://localhost:5000/api/upload/clear-all
```

**Register User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Test User\", \"email\": \"test@example.com\", \"password\": \"password123\"}"
```

**Login User**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test@example.com\", \"password\": \"password123\"}"
```

**Send Email Report**
```bash
curl -X POST http://localhost:5000/api/email/send-report \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"recipient@example.com\", \"includePDF\": true, \"includeExcel\": true}"
```

**Verify Email Config**
```bash
curl http://localhost:5000/api/email/verify
```

---

## 🔧 Maintenance Commands

### Clear Node Modules
```bash
# Backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
cd ..
```

### Update Dependencies
```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update specific package
npm update express

# Frontend updates
cd frontend
npm update
cd ..
```

### Clear Uploads and Reports
```bash
# Windows
del /Q backend\uploads\*.*
del /Q backend\reports\*.*

# Or manually delete files in:
# - backend/uploads/
# - backend/reports/
```

---

## 🐛 Debugging Commands

### Check Port Usage
```bash
# Windows - Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill process using port 5000 (replace PID)
taskkill /PID <PID> /F
```

### View Logs
```bash
# Backend logs (if running with npm run dev)
# Check terminal output

# MongoDB logs (Windows)
type "C:\Program Files\MongoDB\Server\6.0\log\mongod.log"
```

### Environment Variables
```bash
# Print environment variables (Windows)
set

# Check specific variable
echo %MONGODB_URI%

# Set temporary variable
set MONGODB_URI=mongodb://localhost:27017/test
```

---

## 📦 Build Commands

### Frontend Build
```bash
cd frontend

# Development build
npm start

# Production build
npm run build

# Test production build locally
npx serve -s build

cd ..
```

### Backend Build (if using TypeScript)
```bash
# Not applicable for this project (pure JavaScript)
# But for reference:
npm run build
```

---

## 🧹 Cleanup Commands

### Remove All Generated Files
```bash
# Remove node_modules
rm -rf node_modules
rm -rf frontend/node_modules

# Remove package-lock files
rm package-lock.json
rm frontend/package-lock.json

# Remove uploaded files
rm backend/uploads/*

# Remove generated reports
rm backend/reports/*

# Remove build files
rm -rf frontend/build
```

### Reset Database
```bash
# Connect to MongoDB
mongosh

# Drop database
use supply-chain-network
db.dropDatabase()
exit
```

---

## 🔐 Security Commands

### Generate JWT Secret
```bash
# Generate random string for JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Hash Password (for testing)
```bash
# Using bcrypt in Node.js
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('password123', 10, (err, hash) => console.log(hash))"
```

---

## 📊 Database Queries

### Useful MongoDB Queries
```javascript
// Find nodes by type
db.nodes.find({ type: "supplier" })

// Find critical nodes
db.nodes.find({ "metrics.isCritical": true })

// Find bottleneck nodes
db.nodes.find({ "metrics.isBottleneck": true })

// Find active routes
db.routes.find({ status: "active" })

// Find high-risk routes
db.routes.find({ riskLevel: { $in: ["high", "critical"] } })

// Count nodes by type
db.nodes.aggregate([
  { $group: { _id: "$type", count: { $sum: 1 } } }
])

// Count routes by status
db.routes.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Find nodes in specific region
db.nodes.find({ region: "North America" })

// Update node status
db.nodes.updateOne(
  { nodeId: "N1" },
  { $set: { status: "disrupted" } }
)

// Delete specific node
db.nodes.deleteOne({ nodeId: "N1" })
```

---

## 🌐 Network Commands

### Check Connectivity
```bash
# Ping backend
curl http://localhost:5000/api/health

# Check if MongoDB is accessible
mongosh --eval "db.adminCommand('ping')"

# Test email server (if configured)
curl http://localhost:5000/api/email/verify
```

---

## 📱 Browser Commands

### Open Application
```bash
# Windows
start http://localhost:3000

# Or manually navigate to:
# http://localhost:3000
```

### Browser Console Commands
```javascript
// Check localStorage
localStorage.getItem('token')
localStorage.getItem('user')

// Clear localStorage
localStorage.clear()

// Check API response
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(console.log)
```

---

## 🚨 Emergency Commands

### Stop All Processes
```bash
# Stop backend (Ctrl+C in terminal)

# Stop frontend (Ctrl+C in terminal)

# Stop MongoDB
net stop MongoDB

# Kill all Node processes (Windows - use with caution)
taskkill /F /IM node.exe
```

### Reset Everything
```bash
# 1. Stop all processes
# 2. Clear database
mongosh
use supply-chain-network
db.dropDatabase()
exit

# 3. Remove node_modules
rm -rf node_modules frontend/node_modules

# 4. Remove uploads and reports
rm backend/uploads/*
rm backend/reports/*

# 5. Reinstall
npm install
cd frontend && npm install && cd ..

# 6. Restart
npm run dev
# (in another terminal)
cd frontend && npm start
```

---

## 📝 Git Commands (if using version control)

```bash
# Initialize repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Supply Chain Network Analysis Platform"

# Add remote
git remote add origin <your-repo-url>

# Push
git push -u origin main

# Check status
git status

# View changes
git diff
```

---

## 🎯 Quick Reference

**Start Everything:**
```bash
net start MongoDB
npm run dev
cd frontend && npm start
```

**Stop Everything:**
```bash
# Ctrl+C in both terminals
net stop MongoDB
```

**Reset Data:**
```bash
curl -X DELETE http://localhost:5000/api/upload/clear-all
```

**Test Upload:**
```bash
curl -X POST http://localhost:5000/api/upload/nodes -F "file=@sample-data/nodes.csv"
curl -X POST http://localhost:5000/api/upload/routes -F "file=@sample-data/routes.csv"
```

---

## 📚 Help Commands

```bash
# NPM help
npm help

# View package info
npm info express

# List installed packages
npm list

# Check Node version
node --version

# Check npm version
npm --version

# Check MongoDB version
mongod --version
```

---

**💡 Tip:** Bookmark this file for quick command reference!
