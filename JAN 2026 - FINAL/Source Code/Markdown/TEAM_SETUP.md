# 🚀 Team Setup Guide

Quick setup for new developers.

---

## 📦 First Time Setup

```bash
# 1. Clone repo
git clone <your-repo-url>
cd "file web"

# 2. Install packages
npm install
```

**That's it!** ✅

---

## 💻 Daily Development

```bash
# Terminal 1: Start emulator
npm run emulator

# Terminal 2: Start app
npm run dev
```

**First time only:** Run `node seed-simple.js` after starting emulator.

---

## 🔐 Test Accounts

Password for all: `test123456`

| Email | Role |
|-------|------|
| examunit@test.com | Exam Unit (Admin) |
| hos.cs@test.com | HOS (Computer Science) |
| hos.me@test.com | HOS (Mechanical Eng) |
| hos.ee@test.com | HOS (Electrical Eng) |
| lecturer1@test.com | Lecturer (CS) |
| lecturer2@test.com | Lecturer (ME) |
| lecturer3@test.com | Lecturer (EE) |

---

## 🌐 URLs

- **App:** http://localhost:3000
- **Database:** http://localhost:4000

---

## 🔧 Common Issues

### Port 8080 taken?
```powershell
netstat -ano | findstr :8080
taskkill /PID <number> /F
```

### Data disappeared?
Make sure you use `npm run emulator` (not `firebase emulators:start`)

### Fresh start?
```bash
npm run emulator:fresh
node seed-simple.js
```

---

## 📋 Git Workflow

```bash
# Update code
git pull origin main

# Create branch
git checkout -b feature/my-feature

# Push changes
git add .
git commit -m "Description"
git push origin feature/my-feature
```

---

**Need more details?** Check `README.md` or `QUICK_REFERENCE.md`
