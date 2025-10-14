# Supply Chain Social Network Analysis Platform

A full-stack MERN application for analyzing supply chain networks with geospatial visualization, social network metrics, and automated reporting.

## Features

- 📊 **Upload & Analyze**: Import CSV/Excel files with supply chain data
- 🗺️ **Geospatial Visualization**: Interactive maps using Leaflet.js + OpenStreetMap (100% FREE)
- 🕸️ **Network Graph**: Visualize supply chain relationships with Cytoscape.js
- 📈 **Social Network Analysis**: Compute centrality, betweenness, clustering coefficients
- 🚨 **Risk Analysis**: Identify bottlenecks and critical suppliers
- 🔮 **Disruption Prediction**: Simulate failures and suggest alternate routes
- 📄 **Report Generation**: Export PDF/Excel reports with metrics and visualizations
- 📧 **Email Automation**: Send reports via email with NodeMailer + optional cron scheduling
- 🔐 **Authentication**: JWT-based user authentication (optional)

## Tech Stack

- **Frontend**: React, Leaflet.js, Cytoscape.js, Recharts, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Libraries**: Graphology (network analysis), ExcelJS, jsPDF, NodeMailer

## Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Install backend dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your MongoDB URI and email credentials

4. Start backend server:
```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install frontend dependencies:
```bash
npm install
```

3. Start React app:
```bash
npm start
```

Frontend runs on `http://localhost:3000`

### Run Full Stack

From root directory:
```bash
npm run dev:full
```

## Project Structure

```
supply-chain-social-network/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   ├── Node.js               # Supply chain node schema
│   │   ├── Route.js              # Route schema
│   │   └── User.js               # User schema (auth)
│   ├── routes/
│   │   ├── upload.js             # File upload endpoints
│   │   ├── analytics.js          # SNA metrics endpoints
│   │   ├── nodes.js              # Node CRUD
│   │   ├── routes.js             # Route CRUD
│   │   ├── reports.js            # Report generation
│   │   ├── email.js              # Email sending
│   │   └── auth.js               # Authentication
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── upload.js             # Multer config
│   ├── utils/
│   │   ├── networkAnalysis.js    # SNA algorithms
│   │   ├── reportGenerator.js    # PDF/Excel generation
│   │   └── emailService.js       # Email utilities
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
│   │   │   └── Navbar.jsx        # Navigation
│   │   ├── services/
│   │   │   └── api.js            # API calls
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── sample-data/
│   └── supply-chain-sample.csv   # Sample dataset
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Sample Dataset Format

### Nodes CSV
```csv
id,name,type,latitude,longitude,capacity,region
N1,Supplier A,supplier,40.7128,-74.0060,1000,North America
N2,Warehouse B,warehouse,34.0522,-118.2437,5000,North America
N3,Retailer C,retailer,51.5074,-0.1278,500,Europe
```

### Routes CSV
```csv
source,target,distance,cost,time,status
N1,N2,2800,5000,48,active
N2,N3,5500,12000,120,active
```

## API Endpoints

### Upload
- `POST /api/upload/nodes` - Upload nodes CSV/Excel
- `POST /api/upload/routes` - Upload routes CSV/Excel

### Data
- `GET /api/nodes` - Get all nodes
- `GET /api/routes` - Get all routes
- `DELETE /api/nodes/:id` - Delete node
- `DELETE /api/routes/:id` - Delete route

### Analytics
- `GET /api/analytics/metrics` - Get SNA metrics
- `GET /api/analytics/bottlenecks` - Identify bottlenecks
- `POST /api/analytics/simulate-disruption` - Simulate failure

### Reports
- `POST /api/reports/generate-pdf` - Generate PDF report
- `POST /api/reports/generate-excel` - Generate Excel report

### Email
- `POST /api/email/send-report` - Send report via email

### Auth (Optional)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

## Usage Flow

1. **Register/Login** (if authentication enabled)
2. **Upload Dataset**: Upload nodes and routes CSV/Excel files
3. **View Dashboard**: See analytics, metrics, and insights
4. **Explore Map**: Interactive geospatial visualization with Leaflet
5. **Analyze Graph**: Network visualization with Cytoscape.js
6. **Simulate Disruptions**: Test failure scenarios
7. **Generate Reports**: Create PDF/Excel reports
8. **Send Email**: Email reports to stakeholders

## Email Configuration

For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an "App Password"
3. Use the app password in `.env` as `EMAIL_PASSWORD`

## Map API (FREE)

This project uses **Leaflet.js + OpenStreetMap** which is completely free and requires no API key.

Alternative free options:
- Mapbox (50,000 free requests/month)
- Maptiler (100,000 free tiles/month)

## License

ISC
