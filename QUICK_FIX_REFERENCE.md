# 🚀 Quick Fix Reference Card

## 📧 Email Issues?

### Email Not Sending?

### 3-Step Fix:

1. **Create `.env` file:**
   ```bash
   cd backend
   copy .env.example .env
   ```

2. **Add your Gmail credentials:**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_16_char_app_password
   ```

3. **Get Gmail App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Generate new password
   - Copy it to `.env` (no spaces)
   - Restart backend: `npm run dev`

**Test it:**
```bash
curl http://localhost:5000/api/email/verify
```

### Emails Showing N1, N2 Instead of Names?

**Already Fixed!** Just restart backend:
```bash
cd backend
npm run dev
```

Emails now show:
- ✅ "Shanghai Port" instead of "N1"
- ✅ "Los Angeles Hub → Chicago Facility" instead of "N5 → N8"
- ✅ Node IDs in parentheses for reference

---

## 📊 Empty Graphs?

### Quick Checks:

✅ **Data uploaded?**
- Go to Upload page
- Download sample CSVs
- Upload both files

✅ **Metrics calculated?**
```bash
curl http://localhost:5000/api/analytics/metrics
```

✅ **Dashboard refreshed?**
- Click "Refresh" button
- Or press F5

### Already Fixed:
- ✅ Lowered detection thresholds (more nodes detected)
- ✅ Added empty state messages
- ✅ Better data validation

---

## 🔧 Common Issues

| Problem | Quick Fix |
|---------|-----------|
| Backend won't start | `cd backend && npm install` |
| Port in use | Change `PORT=5001` in `.env` |
| MongoDB error | `net start MongoDB` |
| Frontend blank | `cd frontend && npm install && npm start` |
| No data | Upload sample CSV files |
| Email fails | Check `.env` file exists with credentials |

---

## 📚 Full Documentation

- **Email Setup:** `EMAIL_SETUP_GUIDE.md`
- **All Fixes:** `FIXES_APPLIED.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`
- **Quick Start:** `QUICK_START.md`

---

## ✅ Verification Commands

```bash
# Backend running?
curl http://localhost:5000/api/health

# Email configured?
curl http://localhost:5000/api/email/verify

# Data exists?
curl http://localhost:5000/api/nodes
curl http://localhost:5000/api/routes

# Metrics calculated?
curl http://localhost:5000/api/analytics/metrics
```

---

**Need help?** Check `TROUBLESHOOTING.md` for detailed solutions!
