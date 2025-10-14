# Testing Guide - Supply Chain Social Network Analysis

## 🧪 Complete Testing Workflow

This guide provides a comprehensive testing workflow to verify all features of the application.

## Prerequisites

- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- MongoDB connected and running

## Test Suite 1: Data Upload & Management

### Test 1.1: Upload Nodes CSV

**Steps:**
1. Navigate to `http://localhost:3000/upload`
2. Click "Download Sample Nodes CSV" button
3. Click "Click to upload nodes file" in the Nodes section
4. Select the downloaded `sample-nodes.csv` file
5. Click "Upload Nodes" button

**Expected Results:**
- ✅ Success message: "Nodes uploaded successfully"
- ✅ Green notification showing "Inserted: 20"
- ✅ No errors in console

**Backend Verification:**
```bash
curl http://localhost:5000/api/nodes
# Should return 20 nodes
```

### Test 1.2: Upload Routes CSV

**Steps:**
1. Click "Download Sample Routes CSV" button
2. Click "Click to upload routes file" in the Routes section
3. Select the downloaded `sample-routes.csv` file
4. Click "Upload Routes" button

**Expected Results:**
- ✅ Success message: "Routes uploaded successfully"
- ✅ Green notification showing "Inserted: 30"
- ✅ No errors in console

**Backend Verification:**
```bash
curl http://localhost:5000/api/routes
# Should return 30 routes
```

### Test 1.3: Upload Invalid File

**Steps:**
1. Try to upload a .txt or .pdf file
2. Observe error handling

**Expected Results:**
- ✅ Error message: "Please upload a CSV or Excel file"
- ✅ File not uploaded

### Test 1.4: Clear All Data

**Steps:**
1. Click "Clear All" button
2. Confirm the action in the popup
3. Wait for completion

**Expected Results:**
- ✅ Success message: "All data cleared successfully"
- ✅ Nodes and routes deleted from database
- ✅ Dashboard shows "No Data Available"

**Re-upload data before continuing tests**

## Test Suite 2: Dashboard Analytics

### Test 2.1: View Network Health

**Steps:**
1. Navigate to `http://localhost:3000/`
2. Observe the health score card

**Expected Results:**
- ✅ Health score displayed (0-100)
- ✅ Health status shown (Excellent/Good/Fair/Poor/Critical)
- ✅ Gradient background visible

### Test 2.2: View Key Metrics

**Expected Results:**
- ✅ Total Nodes: 20
- ✅ Total Routes: 30
- ✅ Critical Nodes: > 0
- ✅ Bottlenecks: > 0
- ✅ All metric cards display correctly

### Test 2.3: View Charts

**Expected Results:**
- ✅ Node Types Distribution (Pie Chart) - Shows supplier, warehouse, etc.
- ✅ Route Status (Bar Chart) - Shows active, inactive, disrupted
- ✅ Top Critical Nodes (Horizontal Bar Chart) - Shows top 5
- ✅ Top Bottleneck Nodes (Horizontal Bar Chart) - Shows top 5
- ✅ All charts interactive with tooltips

### Test 2.4: View Recommendations

**Expected Results:**
- ✅ Recommendations panel visible
- ✅ Color-coded by priority (critical=red, high=orange, medium=yellow, low=blue)
- ✅ Each recommendation has: priority, issue, description, action

### Test 2.5: Refresh Data

**Steps:**
1. Click "Refresh" button
2. Wait for data to reload

**Expected Results:**
- ✅ Loading indicator appears briefly
- ✅ All data refreshes
- ✅ Metrics recalculated
- ✅ Success notification

## Test Suite 3: Report Generation

### Test 3.1: Generate PDF Report

**Steps:**
1. From Dashboard, click "PDF" button
2. Wait for generation

**Expected Results:**
- ✅ Loading toast: "Generating PDF report..."
- ✅ Success toast: "PDF report generated!"
- ✅ PDF file downloads automatically
- ✅ PDF contains:
  - Network statistics
  - Health score
  - Critical nodes table
  - Bottlenecks table
  - Recommendations

### Test 3.2: Generate Excel Report

**Steps:**
1. Click "Excel" button
2. Wait for generation

**Expected Results:**
- ✅ Loading toast: "Generating Excel report..."
- ✅ Success toast: "Excel report generated!"
- ✅ Excel file downloads automatically
- ✅ Excel contains multiple sheets:
  - Network Statistics
  - Node Metrics
  - Critical Nodes
  - Bottlenecks
  - Recommendations

### Test 3.3: Send Report via Email

**Steps:**
1. Click "Email" button
2. Enter your email address in the modal
3. Click "Send Report"

**Expected Results:**
- ✅ Modal appears with email input
- ✅ Success message: "Report sent to [email]"
- ✅ Email received with:
  - Beautiful HTML content
  - PDF attachment
  - Excel attachment
  - Network health score
  - Key metrics
  - Critical nodes table
  - Recommendations

**Note:** Requires email configuration in `.env`

## Test Suite 4: Map Visualization

### Test 4.1: View Map

**Steps:**
1. Navigate to `http://localhost:3000/map`
2. Wait for map to load

**Expected Results:**
- ✅ OpenStreetMap tiles load
- ✅ 20 nodes visible as colored circles
- ✅ 30 routes visible as colored lines
- ✅ Map centered on average of all nodes
- ✅ Legend visible in bottom-left
- ✅ Info box visible in top-right

### Test 4.2: Node Interactions

**Steps:**
1. Click on any node (circle marker)
2. Observe popup

**Expected Results:**
- ✅ Popup appears with node details:
  - Name
  - ID
  - Type
  - Status
  - Capacity
  - Region, City, Country
  - Degree centrality
  - Betweenness centrality
  - Critical/Bottleneck badges (if applicable)

### Test 4.3: Route Interactions

**Steps:**
1. Click on any route (line)
2. Observe popup

**Expected Results:**
- ✅ Popup appears with route details:
  - Source → Target
  - Distance
  - Cost
  - Time
  - Transport mode
  - Status
  - Risk level

### Test 4.4: Filter by Node Type

**Steps:**
1. Select "Suppliers" from node type dropdown
2. Observe map changes

**Expected Results:**
- ✅ Only supplier nodes visible
- ✅ Only routes connected to suppliers visible
- ✅ Node count updates in header

### Test 4.5: Filter by Critical Nodes

**Steps:**
1. Click "Critical" button (should turn red)
2. Observe map changes

**Expected Results:**
- ✅ Only critical nodes visible
- ✅ Button highlighted in red
- ✅ Routes filtered accordingly

### Test 4.6: Filter by Risk Level

**Steps:**
1. Select "High Risk" from risk level dropdown
2. Observe map changes

**Expected Results:**
- ✅ Only high-risk routes visible (red lines)
- ✅ Route count updates

### Test 4.7: Multiple Filters

**Steps:**
1. Enable "Critical" filter
2. Select "Suppliers" from type dropdown
3. Select "High Risk" from risk dropdown

**Expected Results:**
- ✅ Only critical supplier nodes visible
- ✅ Only high-risk routes connected to them visible
- ✅ Counts update correctly

## Test Suite 5: Graph Visualization

### Test 5.1: View Graph

**Steps:**
1. Navigate to `http://localhost:3000/graph`
2. Wait for graph to render

**Expected Results:**
- ✅ Network graph displays with dagre layout
- ✅ Nodes sized by degree centrality
- ✅ Nodes colored by type
- ✅ Edges colored by risk level
- ✅ Legend visible in top-left
- ✅ Controls visible in header

### Test 5.2: Node Selection

**Steps:**
1. Click on any node in the graph
2. Observe details panel

**Expected Results:**
- ✅ Node highlighted with yellow border
- ✅ Details panel appears on right with:
  - Node name
  - Type, Status, Capacity
  - Region
  - Degree centrality
  - Betweenness centrality
  - Critical/Bottleneck badges

### Test 5.3: Zoom Controls

**Steps:**
1. Click "Zoom In" button multiple times
2. Click "Zoom Out" button multiple times
3. Click "Fit to Screen" button

**Expected Results:**
- ✅ Graph zooms in smoothly
- ✅ Graph zooms out smoothly
- ✅ Graph fits entire network in viewport

### Test 5.4: Export Graph

**Steps:**
1. Click "Export as PNG" button (download icon)
2. Check downloads folder

**Expected Results:**
- ✅ PNG image downloads
- ✅ Image shows current graph view
- ✅ High resolution (2x scale)
- ✅ Success toast: "Graph exported as PNG"

### Test 5.5: Filter Critical Nodes

**Steps:**
1. Click "Critical Only" button
2. Observe graph changes

**Expected Results:**
- ✅ Only critical nodes visible
- ✅ Button highlighted in red
- ✅ Connected edges remain visible

### Test 5.6: Filter Bottlenecks

**Steps:**
1. Click "Reset Filters" first
2. Click "Bottlenecks Only" button
3. Observe graph changes

**Expected Results:**
- ✅ Only bottleneck nodes visible
- ✅ Button highlighted in orange
- ✅ Connected edges remain visible

### Test 5.7: Filter by Node Type

**Steps:**
1. Select "Warehouses" from dropdown
2. Observe graph changes

**Expected Results:**
- ✅ Only warehouse nodes visible
- ✅ Connected routes visible
- ✅ Graph re-layouts automatically

## Test Suite 6: Analytics API

### Test 6.1: Calculate Metrics

**Steps:**
```bash
curl http://localhost:5000/api/analytics/metrics
```

**Expected Results:**
- ✅ Returns JSON with:
  - `nodeMetrics` object with metrics for each node
  - `networkStats` (totalNodes, totalEdges, density, etc.)
  - `bottlenecks` array
  - `criticalNodes` array

### Test 6.2: Get Network Health

**Steps:**
```bash
curl http://localhost:5000/api/analytics/network-health
```

**Expected Results:**
- ✅ Returns JSON with:
  - `healthScore` (0-100)
  - `healthStatus` (string)
  - `summary` object
  - `networkStats` object
  - `recommendations` array

### Test 6.3: Simulate Node Disruption

**Steps:**
```bash
curl -X POST http://localhost:5000/api/analytics/simulate-disruption \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "N1"}'
```

**Expected Results:**
- ✅ Returns JSON with:
  - `disruptionType`: "node"
  - `disruptedElement`: "N1"
  - `impact` object showing affected nodes
  - `alternativePaths` (if available)
  - `recommendation` string

### Test 6.4: Simulate Route Disruption

**Steps:**
```bash
curl -X POST http://localhost:5000/api/analytics/simulate-disruption \
  -H "Content-Type: application/json" \
  -d '{"edgeSource": "N1", "edgeTarget": "N2"}'
```

**Expected Results:**
- ✅ Returns disruption analysis
- ✅ Shows alternative paths between N1 and N2
- ✅ Impact assessment

### Test 6.5: Find Alternative Paths

**Steps:**
```bash
curl -X POST http://localhost:5000/api/analytics/find-paths \
  -H "Content-Type: application/json" \
  -d '{"source": "N1", "target": "N5", "maxPaths": 5}'
```

**Expected Results:**
- ✅ Returns JSON with:
  - `source`: "N1"
  - `target`: "N5"
  - `pathsFound`: number
  - `paths` array with:
    - `path` (array of node IDs)
    - `hops` (number)
    - `totalDistance`, `totalCost`, `totalTime`

## Test Suite 7: Authentication (Optional)

**Note:** Enable authentication by setting `authRequired = true` in `frontend/src/App.js`

### Test 7.1: Register New User

**Steps:**
1. Navigate to `http://localhost:3000/register`
2. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
   - Organization: "Test Org"
3. Click "Create Account"

**Expected Results:**
- ✅ Success toast: "Registration successful!"
- ✅ Redirected to dashboard
- ✅ User logged in automatically
- ✅ Navbar shows user name

### Test 7.2: Login

**Steps:**
1. Logout (click logout button)
2. Navigate to `http://localhost:3000/login`
3. Enter credentials
4. Click "Sign In"

**Expected Results:**
- ✅ Success toast: "Login successful!"
- ✅ Redirected to dashboard
- ✅ User authenticated

### Test 7.3: Protected Routes

**Steps:**
1. Logout
2. Try to access `http://localhost:3000/`

**Expected Results:**
- ✅ Redirected to `/login`
- ✅ Cannot access protected routes without login

## Test Suite 8: Error Handling

### Test 8.1: Backend Offline

**Steps:**
1. Stop backend server
2. Try to upload data or refresh dashboard

**Expected Results:**
- ✅ Error toast: "Failed to load data" or similar
- ✅ No app crash
- ✅ Graceful error handling

### Test 8.2: Invalid Data Upload

**Steps:**
1. Create a CSV with invalid data (missing required fields)
2. Try to upload

**Expected Results:**
- ✅ Error response with details
- ✅ Shows which rows failed
- ✅ Partial success if some rows valid

### Test 8.3: Network Timeout

**Steps:**
1. Simulate slow network in browser DevTools
2. Try operations

**Expected Results:**
- ✅ Loading indicators show
- ✅ Timeout errors handled gracefully
- ✅ User informed of issue

## 📊 Test Results Checklist

After completing all tests, verify:

- [ ] All 20 nodes uploaded successfully
- [ ] All 30 routes uploaded successfully
- [ ] Dashboard displays all metrics correctly
- [ ] All 4 charts render properly
- [ ] PDF report generates and downloads
- [ ] Excel report generates and downloads
- [ ] Email sends successfully (if configured)
- [ ] Map view shows all nodes and routes
- [ ] Map filters work correctly
- [ ] Graph view renders network
- [ ] Graph filters and controls work
- [ ] Node selection shows details
- [ ] Analytics API returns correct data
- [ ] Disruption simulation works
- [ ] Alternative path finding works
- [ ] Authentication works (if enabled)
- [ ] Error handling is graceful
- [ ] No console errors
- [ ] Responsive design works on mobile

## 🎯 Performance Benchmarks

Expected performance:

- **Data Upload**: < 2 seconds for 20 nodes + 30 routes
- **Metrics Calculation**: < 3 seconds
- **Dashboard Load**: < 2 seconds
- **Map Render**: < 1 second
- **Graph Render**: < 2 seconds
- **PDF Generation**: < 3 seconds
- **Excel Generation**: < 2 seconds
- **Email Send**: < 5 seconds

## 🐛 Common Issues & Solutions

### Issue: Graph doesn't render
**Solution:** Check browser console for Cytoscape errors, refresh page

### Issue: Map markers not showing
**Solution:** Verify nodes have valid lat/lng coordinates

### Issue: Charts empty
**Solution:** Ensure data is uploaded and metrics calculated

### Issue: Email fails
**Solution:** Verify email configuration in `.env`, check app password

## ✅ Test Completion

**All tests passed?** Congratulations! Your application is fully functional.

**Some tests failed?** Review the error messages and check:
1. Backend logs
2. Frontend console
3. MongoDB connection
4. Environment variables
5. Network connectivity

---

**Happy Testing! 🚀**
