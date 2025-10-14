# Troubleshooting Guide

This guide addresses common issues and their solutions.

## Table of Contents
- [Email Issues](#email-issues)
- [Empty Graphs/Charts](#empty-graphscharts)
- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Database Issues](#database-issues)

---

## Email Issues

### ❌ Problem: Email not being sent

**Symptoms:**
- Error message: "Error sending email"
- No email received after clicking "Send Report" or "Send Alert"

**Solutions:**

#### 1. Check if `.env` file exists
```bash
cd backend
dir .env
```

If file doesn't exist:
```bash
copy .env.example .env
```

#### 2. Verify email configuration
Open `backend/.env` and ensure these variables are set:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

#### 3. For Gmail users - Use App Password
**Common mistake:** Using regular Gmail password instead of App Password

**Solution:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Go to https://myaccount.google.com/apppasswords
4. Generate new App Password for "Mail"
5. Copy the 16-character password (no spaces)
6. Update `EMAIL_PASSWORD` in `.env` with this App Password
7. Restart backend server

#### 4. Test email configuration
```bash
curl http://localhost:5000/api/email/verify
```

Expected response:
```json
{
  "message": "Email configuration is valid",
  "status": "ready"
}
```

If you get an error, check the backend console logs for details.

#### 5. Common email errors

**Error: "Invalid login"**
- Using regular password instead of App Password (Gmail)
- Incorrect username or password
- 2FA not enabled (Gmail)

**Error: "Connection timeout"**
- Firewall blocking port 587
- Incorrect EMAIL_HOST
- Network connectivity issues

**Error: "Self signed certificate"**
- Add `NODE_TLS_REJECT_UNAUTHORIZED=0` to `.env` (development only)

#### 6. Alternative email providers

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASSWORD=your_password
```

**Yahoo:**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your_email@yahoo.com
EMAIL_PASSWORD=your_app_password
```

---

## Empty Graphs/Charts

### ❌ Problem: Top Critical Nodes and Bottleneck Nodes graphs are empty

**Symptoms:**
- Charts show "No critical nodes detected" or "No bottleneck nodes detected"
- Dashboard loads but specific graphs are empty
- Other charts (Node Types, Route Status) work fine

**Root Causes:**
1. No data uploaded yet
2. Thresholds too high for current network
3. Network too small or simple
4. Metrics not calculated

**Solutions:**

#### 1. Verify data is uploaded
```bash
# Check if nodes exist
curl http://localhost:5000/api/nodes

# Check if routes exist
curl http://localhost:5000/api/routes
```

If empty, upload data:
1. Go to Upload page
2. Download sample CSV files
3. Upload both Nodes and Routes

#### 2. Calculate metrics manually
```bash
curl http://localhost:5000/api/analytics/metrics
```

This will calculate and return:
- Critical nodes
- Bottleneck nodes
- Network statistics

#### 3. Check network size
Minimum requirements for meaningful analysis:
- At least 5 nodes
- At least 5 routes
- Network should be connected

#### 4. Lower thresholds (already fixed in latest version)
The thresholds have been lowered:
- Bottleneck threshold: 0.1 → 0.05
- Critical nodes threshold: 0.15 → 0.1

This means more nodes will be identified as critical or bottlenecks.

#### 5. Verify metrics calculation
Check backend console for errors during metric calculation:
```
Error calculating degree centrality
Error calculating betweenness centrality
```

If you see these errors, there might be an issue with the graph structure.

#### 6. Refresh dashboard
After uploading data:
1. Click the "Refresh" button on dashboard
2. Or reload the page (F5)
3. Metrics should recalculate automatically

#### 7. Check browser console
Open browser DevTools (F12) and check Console tab for errors:
```
Failed to load dashboard data
Error fetching metrics
```

#### 8. Test with sample data
Use the provided sample data which is guaranteed to have critical nodes and bottlenecks:
1. Click "Download Sample Nodes CSV"
2. Click "Download Sample Routes CSV"
3. Upload both files
4. Go to Dashboard

---

## Backend Issues

### ❌ Problem: Backend won't start

**Error: "Cannot find module"**
```bash
cd backend
npm install
```

**Error: "Port 5000 already in use"**
```bash
# Change port in .env
PORT=5001
```

**Error: "MongoDB connection failed"**
```bash
# Start MongoDB
net start MongoDB

# Or use MongoDB Atlas
# Update MONGODB_URI in .env
```

### ❌ Problem: API returns 500 errors

Check backend console logs for detailed error messages.

Common causes:
- Database connection lost
- Missing environment variables
- Corrupted data in database

**Solution: Clear database and restart**
```bash
# Connect to MongoDB
mongosh

# Switch to database
use supply-chain-network

# Drop collections
db.nodes.drop()
db.routes.drop()

# Exit and restart backend
exit
```

---

## Frontend Issues

### ❌ Problem: Frontend shows blank page

**Check browser console (F12):**
- Look for JavaScript errors
- Check Network tab for failed API calls

**Solution:**
```bash
cd frontend
npm install
npm start
```

### ❌ Problem: "Failed to load dashboard data"

**Cause:** Backend not running or wrong API URL

**Solution:**
1. Verify backend is running on port 5000
2. Check `frontend/.env` or `frontend/src/services/api.js`
3. Ensure API_BASE_URL is correct: `http://localhost:5000/api`

---

## Database Issues

### ❌ Problem: Data not persisting

**Cause:** MongoDB not running

**Solution:**
```bash
# Windows
net start MongoDB

# Check status
mongosh
```

### ❌ Problem: Duplicate key errors

**Cause:** Trying to upload same data twice

**Solution:**
1. Use "Clear All Data" button in Upload page
2. Or drop collections manually:
```bash
mongosh
use supply-chain-network
db.nodes.drop()
db.routes.drop()
```

---

## Still Having Issues?

### Debug Checklist

1. **Backend running?**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Frontend running?**
   - Open http://localhost:3000

3. **MongoDB running?**
   ```bash
   mongosh
   ```

4. **Environment variables set?**
   ```bash
   cd backend
   type .env
   ```

5. **Dependencies installed?**
   ```bash
   npm list
   cd frontend
   npm list
   ```

6. **Check logs:**
   - Backend console output
   - Browser DevTools Console (F12)
   - MongoDB logs

### Get Help

If issues persist:
1. Check backend console for error messages
2. Check browser console (F12) for frontend errors
3. Review the logs carefully
4. Ensure all prerequisites are met (Node.js, MongoDB, etc.)

### Common Error Messages and Solutions

| Error | Solution |
|-------|----------|
| "No nodes found" | Upload data first |
| "Email configuration error" | Set up `.env` file with email credentials |
| "MongoDB connection failed" | Start MongoDB service |
| "Port already in use" | Change PORT in `.env` |
| "Invalid token" | Log in again |
| "CORS error" | Check backend CORS configuration |

---

## Prevention Tips

1. **Always check `.env` file exists** before starting backend
2. **Start MongoDB first** before backend
3. **Upload data** before viewing analytics
4. **Use sample data** for testing
5. **Check console logs** for detailed errors
6. **Keep dependencies updated** with `npm update`

---

**Need more help?** See other documentation:
- `QUICK_START.md` - Basic setup
- `EMAIL_SETUP_GUIDE.md` - Email configuration
- `SETUP_GUIDE.md` - Detailed setup instructions
