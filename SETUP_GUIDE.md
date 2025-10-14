# Supply Chain Social Network Analysis - Complete Setup Guide

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (local or MongoDB Atlas account) - [Download](https://www.mongodb.com/try/download/community)
- **Git** (optional) - [Download](https://git-scm.com/)

## 🚀 Quick Start (5 Steps)

### Step 1: Install Backend Dependencies

Open terminal in the project root directory:

```bash
cd d:/CODE/HI/supply-chain-social-network
npm install
```

This will install all backend dependencies including:
- Express, Mongoose, JWT, Multer
- NodeMailer, node-cron
- jsPDF, ExcelJS
- Graphology (for network analysis)

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

This will install React, TailwindCSS, Leaflet, Cytoscape, Recharts, and other frontend dependencies.

### Step 3: Configure Environment Variables

Create a `.env` file in the **root directory** (same level as package.json):

```bash
# Navigate back to root
cd ..

# Create .env file (Windows)
copy .env.example .env

# Or manually create .env file and add the following:
```

**Edit `.env` file with these values:**

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/supply-chain-network

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (change this to a random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Important Notes:**
- **MongoDB**: If using MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string
- **Email**: For Gmail, you need to generate an "App Password" (see Email Setup section below)
- **JWT_SECRET**: Use a long random string for production

### Step 4: Start MongoDB

**Option A - Local MongoDB:**
```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# Or start manually
mongod
```

**Option B - MongoDB Atlas:**
- Use your Atlas connection string in `.env`
- No local MongoDB needed

### Step 5: Run the Application

Open **TWO terminal windows**:

**Terminal 1 - Backend:**
```bash
# From project root
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running on port 5000
📍 Environment: development
```

**Terminal 2 - Frontend:**
```bash
# From project root
cd frontend
npm start
```

Browser will automatically open at `http://localhost:3000`

## 📧 Email Configuration (Optional but Recommended)

### For Gmail:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the 16-character password
3. **Update `.env`:**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # The app password
   ```

### For Other Email Providers:

Update these values in `.env`:
```env
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@provider.com
EMAIL_PASSWORD=your-password
```

## 📊 Testing the Application

### Test Flow 1: Upload Sample Data

1. **Navigate to Upload Page** (`http://localhost:3000/upload`)

2. **Download Sample CSVs:**
   - Click "Download Sample Nodes CSV"
   - Click "Download Sample Routes CSV"

3. **Upload Files:**
   - Upload `sample-nodes.csv` to Nodes section
   - Upload `sample-routes.csv` to Routes section
   - Wait for success messages

4. **Verify Upload:**
   - Check terminal for upload logs
   - You should see "Inserted: 20" for nodes and "Inserted: 30" for routes

### Test Flow 2: View Dashboard

1. **Navigate to Dashboard** (`http://localhost:3000/`)

2. **Verify Data Display:**
   - Network Health Score should be visible
   - Total Nodes: 20
   - Total Routes: 30
   - Charts should populate with data

3. **Test Analytics:**
   - Click "Refresh" to recalculate metrics
   - View Critical Nodes chart
   - View Bottlenecks chart
   - Check Recommendations panel

4. **Generate Reports:**
   - Click "PDF" button → Downloads PDF report
   - Click "Excel" button → Downloads Excel report
   - Click "Email" button → Send report via email (if configured)

### Test Flow 3: Map Visualization

1. **Navigate to Map View** (`http://localhost:3000/map`)

2. **Verify Map Display:**
   - Should see 20 nodes on world map
   - Routes displayed as colored lines
   - Nodes colored by type (blue=supplier, purple=warehouse, etc.)

3. **Test Interactions:**
   - Click on any node → Popup with details
   - Click on any route → Popup with route info
   - Use filters to show only specific types

4. **Test Filters:**
   - Click "Critical" → Shows only critical nodes
   - Click "Bottlenecks" → Shows only bottleneck nodes
   - Select "Suppliers" from dropdown → Shows only supplier nodes
   - Select "High Risk" → Shows only high-risk routes

### Test Flow 4: Graph Visualization

1. **Navigate to Graph View** (`http://localhost:3000/graph`)

2. **Verify Graph Display:**
   - Network graph with nodes and edges
   - Nodes sized by centrality
   - Edges colored by risk level

3. **Test Controls:**
   - Click "Zoom In" / "Zoom Out"
   - Click "Fit to Screen"
   - Click "Export as PNG" → Downloads graph image

4. **Test Filters:**
   - Toggle "Critical Only"
   - Toggle "Bottlenecks Only"
   - Select different node types
   - Select different route statuses

5. **Test Node Selection:**
   - Click any node → Details panel appears on right
   - View node metrics (degree, betweenness)
   - Check if node is critical or bottleneck

### Test Flow 5: Email Automation (Optional)

1. **Verify Email Config:**
   ```bash
   # Test endpoint
   curl http://localhost:5000/api/email/verify
   ```

2. **Send Test Report:**
   - Go to Dashboard
   - Click "Email" button
   - Enter your email address
   - Click "Send Report"
   - Check your inbox for report with PDF/Excel attachments

3. **Schedule Automated Reports (requires authentication):**
   - Enable authentication in `frontend/src/App.js` (set `authRequired = true`)
   - Register/Login
   - Use schedule endpoint to set up daily/weekly/monthly reports

## 🔐 Authentication (Optional)

By default, authentication is **disabled** for easy testing. To enable:

1. **Edit `frontend/src/App.js`:**
   ```javascript
   const [authRequired, setAuthRequired] = useState(true); // Change to true
   ```

2. **Restart frontend:**
   ```bash
   npm start
   ```

3. **Register a new account:**
   - Navigate to `http://localhost:3000/register`
   - Fill in name, email, password
   - Click "Create Account"

4. **Login:**
   - Use your credentials to login
   - All data will be user-specific

## 🧪 API Testing with Postman/cURL

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Get All Nodes
```bash
curl http://localhost:5000/api/nodes
```

### Get Analytics Metrics
```bash
curl http://localhost:5000/api/analytics/metrics
```

### Get Network Health
```bash
curl http://localhost:5000/api/analytics/network-health
```

### Simulate Disruption
```bash
curl -X POST http://localhost:5000/api/analytics/simulate-disruption \
  -H "Content-Type: application/json" \
  -d '{"nodeId": "N1"}'
```

### Find Alternative Paths
```bash
curl -X POST http://localhost:5000/api/analytics/find-paths \
  -H "Content-Type: application/json" \
  -d '{"source": "N1", "target": "N5", "maxPaths": 5}'
```

## 📁 Project Structure

```
supply-chain-social-network/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   ├── Node.js               # Node schema
│   │   ├── Route.js              # Route schema
│   │   └── User.js               # User schema
│   ├── routes/
│   │   ├── auth.js               # Authentication
│   │   ├── upload.js             # File upload
│   │   ├── nodes.js              # Node CRUD
│   │   ├── routes.js             # Route CRUD
│   │   ├── analytics.js          # SNA metrics
│   │   ├── reports.js            # PDF/Excel generation
│   │   └── email.js              # Email automation
│   ├── middleware/
│   │   ├── auth.js               # JWT middleware
│   │   └── upload.js             # Multer config
│   ├── utils/
│   │   ├── networkAnalysis.js    # SNA algorithms
│   │   ├── reportGenerator.js    # Report generation
│   │   └── emailService.js       # Email service
│   ├── uploads/                  # Uploaded files
│   ├── reports/                  # Generated reports
│   └── server.js                 # Express app
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx     # Analytics dashboard
│   │   │   ├── MapView.jsx       # Leaflet map
│   │   │   ├── GraphView.jsx     # Cytoscape graph
│   │   │   ├── Upload.jsx        # File upload
│   │   │   ├── Login.jsx         # Authentication
│   │   │   ├── Register.jsx      # Registration
│   │   │   └── Navbar.jsx        # Navigation
│   │   ├── services/
│   │   │   └── api.js            # API calls
│   │   ├── App.js                # Main app
│   │   ├── index.js              # Entry point
│   │   └── index.css             # Styles
│   └── package.json
├── sample-data/
│   ├── nodes.csv                 # Sample nodes
│   └── routes.csv                # Sample routes
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── package.json                  # Backend dependencies
└── README.md                     # Documentation
```

## 🛠️ Troubleshooting

### MongoDB Connection Error
```
❌ MongoDB Connection Error: connect ECONNREFUSED
```
**Solution:**
- Ensure MongoDB is running: `mongod` or `net start MongoDB`
- Check `MONGODB_URI` in `.env`
- For Atlas, verify connection string and whitelist your IP

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
- Change `PORT` in `.env` to another port (e.g., 5001)
- Or kill the process using port 5000

### Email Sending Fails
```
Error sending email: Invalid login
```
**Solution:**
- Verify email credentials in `.env`
- For Gmail, use App Password (not regular password)
- Check `EMAIL_HOST` and `EMAIL_PORT` are correct

### Frontend Build Errors
```
Module not found: Can't resolve 'leaflet'
```
**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
- Ensure backend is running on port 5000
- Check `proxy` in `frontend/package.json` is set to `http://localhost:5000`

## 🎯 Feature Checklist

After setup, verify all features work:

- [ ] Upload CSV/Excel files
- [ ] View nodes and routes on dashboard
- [ ] Calculate SNA metrics (degree, betweenness, clustering)
- [ ] Identify critical nodes and bottlenecks
- [ ] View interactive map with Leaflet.js
- [ ] View network graph with Cytoscape.js
- [ ] Filter by node type, status, risk level
- [ ] Generate PDF reports
- [ ] Generate Excel reports
- [ ] Send reports via email
- [ ] Simulate disruptions
- [ ] Find alternative paths
- [ ] View network health score
- [ ] View recommendations

## 📚 Additional Resources

- **MongoDB Documentation:** https://docs.mongodb.com/
- **Express.js Guide:** https://expressjs.com/
- **React Documentation:** https://react.dev/
- **Leaflet.js:** https://leafletjs.com/
- **Cytoscape.js:** https://js.cytoscape.org/
- **TailwindCSS:** https://tailwindcss.com/

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all dependencies are installed
3. Check console logs for error messages
4. Ensure MongoDB is running
5. Verify `.env` configuration

## 🎉 Success!

If everything is working, you should see:
- ✅ Backend running on http://localhost:5000
- ✅ Frontend running on http://localhost:3000
- ✅ MongoDB connected
- ✅ Sample data uploaded
- ✅ Dashboard showing analytics
- ✅ Map and graph visualizations working
- ✅ Reports generating successfully

**Congratulations! Your Supply Chain Network Analysis platform is ready!** 🚀
