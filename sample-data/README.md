# Sample Supply Chain Network Dataset

## Overview

This dataset represents a **realistic global supply chain network** with 30 nodes and 100+ routes across multiple continents. It's designed to showcase all features of the Supply Chain Network Analysis platform.

---

## Dataset Statistics

### Nodes (30 total)
- **Ports:** 7 major international ports
- **Distribution Centers:** 11 logistics hubs
- **Warehouses:** 7 storage facilities
- **Manufacturing Plants:** 5 production facilities

### Geographic Coverage
- **Asia:** 11 nodes
- **North America:** 9 nodes
- **Europe:** 7 nodes
- **Middle East:** 1 node
- **South America:** 1 node
- **Africa:** 2 nodes
- **Oceania:** 1 node

### Routes (101 total)
- **Road:** 67 routes
- **Sea:** 27 routes
- **Air:** 7 routes

### Status Distribution
- **Active Nodes:** 28
- **Disrupted Nodes:** 2 (N21, N30)
- **Active Routes:** 97
- **Disrupted Routes:** 4

### Risk Levels
- **Low Risk:** 68 routes
- **Medium Risk:** 22 routes
- **High Risk:** 9 routes
- **Critical Risk:** 2 routes

---

## Key Features of This Dataset

### ✅ Critical Nodes (Bottlenecks)
The network is designed to have several **critical hub nodes** that will be identified by the analysis:

1. **Shanghai Port (N1)** - Major Asian hub with 5 connections
2. **Los Angeles Port (N2)** - Key North American gateway with 5 connections
3. **Rotterdam Port (N3)** - European distribution hub with 5 connections
4. **Singapore Hub (N4)** - Strategic Asian port with 5 connections
5. **London Distribution Center (N10)** - European logistics center with 5 connections
6. **Paris Distribution Center (N22)** - Central European hub with 5 connections

### 🚧 Bottleneck Nodes
Nodes with high betweenness centrality (critical for network flow):
- **N1 (Shanghai Port)** - Connects Asia to Americas
- **N4 (Singapore Hub)** - Links Asia-Pacific routes
- **N10 (London Distribution Center)** - European gateway
- **N11 (Dubai Logistics Hub)** - Middle East connector

### ⚠️ Disrupted Nodes
Two nodes are currently disrupted to test alert systems:
- **N21 (Mexico City Manufacturing)** - Production facility down
- **N30 (Osaka Manufacturing)** - Plant disruption

### 🚨 High-Risk Routes
Several routes with elevated risk levels:
- **N26 → N27** (Cairo → Cape Town) - CRITICAL risk, Air transport
- **N27 → N26** (Cape Town → Cairo) - CRITICAL risk, Air transport
- **N13 → N21** (Seattle → Mexico City) - CRITICAL risk, DISRUPTED
- **N21 → N13** (Mexico City → Seattle) - CRITICAL risk, DISRUPTED
- **N16 → N19** (Miami → São Paulo) - HIGH risk, DISRUPTED
- **N19 → N16** (São Paulo → Miami) - HIGH risk, DISRUPTED

### 🌊 Long-Distance Sea Routes
Major transoceanic connections:
- **N1 → N2** (Shanghai → Los Angeles) - 11,500 km, 15 days
- **N19 → N20** (São Paulo → Sydney) - 8,200 km, 20 days
- **N12 → N15** (Mumbai → Hong Kong) - 6,200 km, 7 days

### ✈️ Air Freight Routes
High-speed, high-cost connections:
- **N11 → N12** (Dubai → Mumbai)
- **N11 → N15** (Dubai → Hong Kong)
- **N11 → N18** (Dubai → Bangkok)
- **N26 → N27** (Cairo → Cape Town)

---

## What This Dataset Will Demonstrate

### 📊 Dashboard Features
- **Health Score:** ~75-85 (Good to Excellent)
- **Network Density:** Moderate connectivity
- **Critical Nodes:** 5-8 nodes identified
- **Bottlenecks:** 4-6 nodes identified
- **Active vs Disrupted:** Clear visualization

### 🗺️ Map Visualization
- **Global Coverage:** Nodes span all continents
- **Route Visualization:** Clear connection patterns
- **Status Colors:** Active (green), Disrupted (red)
- **Risk Indicators:** Color-coded routes

### 📈 Network Analysis
- **Degree Centrality:** Hub identification
- **Betweenness Centrality:** Bottleneck detection
- **Clustering Coefficient:** Community structure
- **Path Finding:** Alternative route discovery

### 🔍 Disruption Simulation
Test scenarios:
1. **Remove N1 (Shanghai Port)** - Major Asian disruption
2. **Remove N10 (London DC)** - European impact
3. **Remove N1 → N2 route** - Trans-Pacific disruption

### 📧 Email Alerts
Will trigger alerts for:
- 2 disrupted nodes
- 4 disrupted routes
- 11 high/critical risk routes
- 4-6 bottleneck nodes

### 📄 Reports (PDF/Excel)
Comprehensive data including:
- All 30 nodes with metrics
- 101 routes with risk analysis
- Network statistics
- Recommendations

---

## How to Use This Dataset

### Option 1: Upload via UI (Recommended)

1. **Start the application:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

2. **Navigate to Upload page** (http://localhost:3000/upload)

3. **Upload files:**
   - Click "Choose File" for Nodes
   - Select `sample-data/nodes.csv`
   - Click "Upload Nodes"
   - Click "Choose File" for Routes
   - Select `sample-data/routes.csv`
   - Click "Upload Routes"

4. **View results:**
   - Go to Dashboard to see analytics
   - Check Map View for geographic visualization
   - Explore Graph View for network structure

### Option 2: Direct API Upload

```bash
# Upload nodes
curl -X POST http://localhost:5000/api/upload/nodes \
  -F "file=@sample-data/nodes.csv"

# Upload routes
curl -X POST http://localhost:5000/api/upload/routes \
  -F "file=@sample-data/routes.csv"
```

### Option 3: MongoDB Import (Advanced)

```bash
# Convert CSV to JSON and import
mongoimport --db supply-chain-network --collection nodes --type csv --headerline --file sample-data/nodes.csv
mongoimport --db supply-chain-network --collection routes --type csv --headerline --file sample-data/routes.csv
```

---

## Expected Analysis Results

### Network Metrics
```
Total Nodes: 30
Total Routes: 101
Network Density: ~0.12
Average Degree: ~6.7
Clustering Coefficient: ~0.3
```

### Top 5 Critical Nodes (Expected)
1. Shanghai Port (N1) - Score: ~0.85
2. Los Angeles Port (N2) - Score: ~0.78
3. Rotterdam Port (N3) - Score: ~0.75
4. Singapore Hub (N4) - Score: ~0.72
5. London Distribution Center (N10) - Score: ~0.68

### Top 5 Bottleneck Nodes (Expected)
1. Shanghai Port (N1) - Betweenness: High
2. Singapore Hub (N4) - Betweenness: High
3. Dubai Logistics Hub (N11) - Betweenness: Medium-High
4. London Distribution Center (N10) - Betweenness: Medium-High
5. Paris Distribution Center (N22) - Betweenness: Medium

### Health Assessment
- **Health Score:** 75-85/100
- **Status:** Good to Excellent
- **Issues:** 2 disrupted nodes, 4 disrupted routes
- **Recommendations:** 3-5 actionable items

---

## Data Schema

### Nodes CSV Format
```csv
nodeId,name,type,latitude,longitude,capacity,region,status
```

**Fields:**
- `nodeId`: Unique identifier (N1, N2, etc.)
- `name`: Human-readable location name
- `type`: Port, Distribution Center, Warehouse, Manufacturing Plant
- `latitude`: Geographic coordinate (-90 to 90)
- `longitude`: Geographic coordinate (-180 to 180)
- `capacity`: Storage/throughput capacity (units)
- `region`: Geographic region
- `status`: active, disrupted, maintenance

### Routes CSV Format
```csv
source,target,distance,cost,time,transportMode,status,riskLevel
```

**Fields:**
- `source`: Source node ID
- `target`: Target node ID
- `distance`: Distance in kilometers
- `cost`: Transportation cost in USD
- `time`: Transit time in days
- `transportMode`: Road, Sea, Air, Rail
- `status`: active, disrupted, delayed
- `riskLevel`: low, medium, high, critical

---

## Customization

### Modify Node Status
To test different scenarios, edit `nodes.csv`:
```csv
N1,Shanghai Port,Port,31.2304,121.4737,50000,Asia,disrupted
```

### Add New Routes
Add rows to `routes.csv`:
```csv
N1,N30,3500,7500,4,Air,active,medium
```

### Change Risk Levels
Update `riskLevel` column:
```csv
N1,N2,11500,25000,15,Sea,active,critical
```

---

## Testing Scenarios

### Scenario 1: Major Port Disruption
1. Change N1 status to "disrupted"
2. Upload data
3. Check dashboard for impact
4. Send alert email

### Scenario 2: High-Risk Route Analysis
1. Change multiple routes to "critical" risk
2. Upload data
3. View recommendations
4. Generate PDF report

### Scenario 3: Network Resilience
1. Use disruption simulation
2. Remove N1 (Shanghai Port)
3. Find alternative paths
4. Assess network impact

---

## Real-World Inspiration

This dataset is inspired by actual global supply chain patterns:

- **Trans-Pacific Trade:** N1 (Shanghai) ↔ N2 (Los Angeles)
- **Europe-Asia Corridor:** N3 (Rotterdam) ↔ N4 (Singapore)
- **Middle East Hub:** N11 (Dubai) as regional connector
- **South America Trade:** N19 (São Paulo) connections
- **African Routes:** N26 (Cairo) ↔ N27 (Cape Town)

---

## Tips for Best Results

1. **Upload both files** - Nodes first, then routes
2. **Wait for processing** - Large datasets take 2-3 seconds
3. **Refresh dashboard** - Click refresh after upload
4. **Check console** - Backend logs show calculation progress
5. **Test email** - Configure .env before testing alerts

---

## Troubleshooting

**No data showing?**
- Verify files uploaded successfully
- Check backend console for errors
- Ensure MongoDB is running

**Empty graphs?**
- Click "Refresh" on dashboard
- Check that routes reference valid node IDs
- Verify CSV format matches schema

**Low health score?**
- Expected with 2 disrupted nodes
- Check recommendations for improvements
- Review high-risk routes

---

## Next Steps

After uploading this dataset:

1. ✅ **Explore Dashboard** - View all metrics and charts
2. ✅ **Check Map View** - See geographic distribution
3. ✅ **Test Graph View** - Interact with network visualization
4. ✅ **Generate Reports** - Create PDF and Excel exports
5. ✅ **Send Email** - Test email functionality
6. ✅ **Simulate Disruption** - Test "what-if" scenarios
7. ✅ **Find Paths** - Discover alternative routes

---

**Enjoy exploring your supply chain network! 🌐📦🚢**
