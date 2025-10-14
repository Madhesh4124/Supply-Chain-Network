# 🔧 Upload Issue Fix Guide

## Problem: "Missing nodes: N1, N2, N3..." Error

This error occurs when routes reference nodes that don't exist in the database.

---

## 🎯 Quick Fix (Choose One)

### Option 1: Clear Data and Re-upload (Recommended)

1. **Clear all existing data:**
   - Go to Upload page
   - Click **"Clear All Data"** button
   - Confirm deletion

2. **Upload in correct order:**
   - First: Upload `nodes.csv`
   - Wait for success message
   - Second: Upload `routes.csv`
   - Wait for success message

3. **Check Dashboard:**
   - Should show 30 nodes, 101 routes

### Option 2: Use API to Clear Data

```bash
# Clear all data via API
curl -X DELETE http://localhost:5000/api/upload/clear-all
```

Then upload files again.

### Option 3: Clear MongoDB Directly

```bash
# Connect to MongoDB
mongosh

# Switch to database
use supply-chain-network

# Drop collections
db.nodes.drop()
db.routes.drop()

# Exit
exit
```

Then upload files again.

---

## 🔍 Root Causes

### Cause 1: Wrong Upload Order
**Problem:** Uploading routes before nodes

**Solution:** Always upload nodes FIRST, then routes

### Cause 2: User Authentication Mismatch
**Problem:** Uploaded nodes while logged in, then uploaded routes while logged out (or vice versa)

**Solution:** 
- Stay logged in for both uploads, OR
- Stay logged out for both uploads
- Don't switch between logged in/out during upload

### Cause 3: Old Data in Database
**Problem:** Previous uploads left orphaned data

**Solution:** Clear all data before uploading new dataset

### Cause 4: Column Header Mismatch
**Problem:** CSV uses wrong column names

**Solution:** Ensure CSV headers match:
- Nodes: `nodeId` or `id` (both work)
- Routes: `source`, `target`

---

## ✅ Correct Upload Process

### Step-by-Step:

1. **Start Fresh:**
   ```
   Upload Page → Click "Clear All Data"
   ```

2. **Upload Nodes First:**
   ```
   Choose File → sample-data/nodes.csv
   Click "Upload Nodes"
   Wait for: "✅ 30 nodes uploaded successfully"
   ```

3. **Upload Routes Second:**
   ```
   Choose File → sample-data/routes.csv
   Click "Upload Routes"
   Wait for: "✅ 101 routes uploaded successfully"
   ```

4. **Verify:**
   ```
   Dashboard → Should show:
   - Total Nodes: 30
   - Total Routes: 101
   ```

---

## 🔧 Verify Your CSV Files

### Check Nodes CSV Header:
```csv
nodeId,name,type,latitude,longitude,capacity,region,status
```
✅ First column must be `nodeId` or `id`

### Check Routes CSV Header:
```csv
source,target,distance,cost,time,transportMode,status,riskLevel
```
✅ Must have `source` and `target` columns

### Check Node IDs Match:
- Every `source` in routes.csv must exist in nodes.csv
- Every `target` in routes.csv must exist in nodes.csv

---

## 🧪 Test Your Files

### Quick Test:
```bash
# Check nodes file
head -5 sample-data/nodes.csv

# Check routes file
head -5 sample-data/routes.csv

# Count nodes
wc -l sample-data/nodes.csv
# Should show: 31 (30 nodes + 1 header)

# Count routes
wc -l sample-data/routes.csv
# Should show: 102 (101 routes + 1 header)
```

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Uploading Routes First
```
1. Upload routes.csv ❌
2. Upload nodes.csv
Result: Routes fail because nodes don't exist yet
```

### ✅ Correct Order:
```
1. Upload nodes.csv ✅
2. Upload routes.csv ✅
Result: All routes link to existing nodes
```

### ❌ Mistake 2: Mixing Logged In/Out
```
1. Login
2. Upload nodes (saved with user ID)
3. Logout
4. Upload routes (looks for nodes without user ID) ❌
Result: Can't find nodes
```

### ✅ Stay Consistent:
```
Option A: Stay logged out for both
Option B: Stay logged in for both
```

### ❌ Mistake 3: Not Clearing Old Data
```
1. Upload dataset A
2. Upload dataset B (different node IDs)
Result: Dataset B routes reference Dataset A nodes
```

### ✅ Clear First:
```
1. Clear All Data
2. Upload new dataset
```

---

## 📊 Expected Results

### After Successful Upload:

**Nodes Upload:**
```json
{
  "message": "Nodes uploaded successfully",
  "inserted": 30,
  "duplicates": 0,
  "errors": []
}
```

**Routes Upload:**
```json
{
  "message": "Routes uploaded successfully",
  "inserted": 101,
  "skipped": 0,
  "missingNodes": []
}
```

**Dashboard:**
```
Total Nodes: 30
Total Routes: 101
Health Score: 78/100
Critical Nodes: 5-8
Bottlenecks: 4-6
```

---

## 🔄 Reset Everything

If you're completely stuck:

```bash
# 1. Stop backend (Ctrl+C)

# 2. Clear MongoDB
mongosh
use supply-chain-network
db.dropDatabase()
exit

# 3. Restart backend
cd backend
npm run dev

# 4. Upload fresh data
# - Go to Upload page
# - Upload nodes.csv
# - Upload routes.csv
```

---

## 🎯 Pro Tips

1. **Always upload nodes first** - Routes depend on nodes existing
2. **Stay logged in or out** - Don't switch during upload
3. **Clear before re-upload** - Prevents data conflicts
4. **Check success messages** - Wait for confirmation
5. **Verify on dashboard** - Check counts match expectations

---

## 📝 Checklist

Before uploading:
- [ ] Backend is running
- [ ] MongoDB is running
- [ ] Decided: logged in or logged out (stay consistent)
- [ ] Have nodes.csv ready
- [ ] Have routes.csv ready

During upload:
- [ ] Clear all existing data
- [ ] Upload nodes.csv FIRST
- [ ] Wait for success message
- [ ] Upload routes.csv SECOND
- [ ] Wait for success message

After upload:
- [ ] Check dashboard shows correct counts
- [ ] Verify graphs are populated
- [ ] Test map view
- [ ] Test graph view

---

## 🆘 Still Having Issues?

### Debug Steps:

1. **Check backend console:**
   ```
   Look for error messages
   Check what's being processed
   ```

2. **Check MongoDB:**
   ```bash
   mongosh
   use supply-chain-network
   db.nodes.count()  # Should be 30
   db.routes.count() # Should be 101
   ```

3. **Check CSV format:**
   ```bash
   # Open in text editor
   # Verify no extra spaces
   # Verify proper commas
   # Verify no special characters
   ```

4. **Try minimal test:**
   ```csv
   # Create test-nodes.csv
   nodeId,name,type,latitude,longitude,capacity,region,status
   N1,Test Node,Port,0,0,1000,Test,active
   
   # Create test-routes.csv
   source,target,distance,cost,time,transportMode,status,riskLevel
   N1,N1,100,200,1,Road,active,low
   
   # Upload both
   # Should work
   ```

---

**Follow this guide and your uploads will work perfectly! 📦✅**
