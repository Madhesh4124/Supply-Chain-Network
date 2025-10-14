# ⚡ Quick Start Guide

Get your Supply Chain Network Analysis platform running in **5 minutes**!

## 📦 Step 1: Install Dependencies (2 minutes)

```bash
# Navigate to project directory
cd d:/CODE/HI/supply-chain-social-network

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## ⚙️ Step 2: Configure Environment (1 minute)

Create `.env` file in the backend directory:

```bash
# Navigate to backend folder
cd backend

# Copy the example file
copy .env.example .env
```

Edit `backend/.env` with these **minimum required** settings:

```env
MONGODB_URI=mongodb://localhost:27017/supply-chain-network
PORT=5000
JWT_SECRET=my_secret_key_12345
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

**Note:** Email is optional for initial testing. You can use dummy values.

**For Gmail users:** You need to:
1. Enable 2-Factor Authentication
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Use the App Password (not your regular password)

📧 **See `EMAIL_SETUP_GUIDE.md` for detailed email configuration**

## 🗄️ Step 3: Start MongoDB (30 seconds)

**Windows:**
```bash
net start MongoDB
```

**Or use MongoDB Atlas** (cloud - no local install needed):
- Get free connection string from https://www.mongodb.com/cloud/atlas
- Replace `MONGODB_URI` in `.env`

## 🚀 Step 4: Run the Application (1 minute)

Open **TWO terminals**:

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## ✅ Step 5: Test It! (30 seconds)

1. Browser opens at `http://localhost:3000`
2. Click **"Upload Data"** in navbar
3. Click **"Download Sample Nodes CSV"**
4. Click **"Download Sample Routes CSV"**
5. Upload both files
6. Click **"Dashboard"** to see your network analysis!

---

## 🎯 What You Get

✅ **Dashboard** - Real-time analytics with health scores and charts  
✅ **Map View** - Interactive geospatial visualization (Leaflet + OpenStreetMap)  
✅ **Graph View** - Network graph with Cytoscape.js  
✅ **Analytics** - Degree centrality, betweenness, clustering coefficients  
✅ **Reports** - PDF/Excel generation  
✅ **Email** - Automated report delivery  
✅ **Disruption Simulation** - Test failure scenarios  

---

## 🆘 Quick Troubleshooting

**Backend won't start?**
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
net start MongoDB
```

**Frontend errors?**
```bash
# Clear and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Port already in use?**
- Change `PORT=5000` to `PORT=5001` in `.env`

---

## 📚 Need More Help?

- **Full Setup Guide:** See `SETUP_GUIDE.md`
- **Email Configuration:** See `EMAIL_SETUP_GUIDE.md`
- **Testing Guide:** See `TESTING_GUIDE.md`
- **API Documentation:** See `README.md`

---

**That's it! You're ready to analyze supply chain networks! 🎉**
