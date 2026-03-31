# ⚡ Quick Reference

Essential commands only.

---

## 🎯 Daily Commands

```bash
# Start development
npm run emulator          # Terminal 1
npm run dev              # Terminal 2

# Fresh start (reset data)
npm run emulator:fresh
node seed-simple.js
```

---

## 🔐 Login

All passwords: `test123456`

- Exam Unit: `examunit@test.com`
- HOS (CS): `hos.cs@test.com`
- Lecturer: `lecturer1@test.com`

---

## 🌐 Access

- App: http://localhost:3000
- Database: http://localhost:4000

---

## 🔧 Fix Port Issue

```powershell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
npm run emulator
```

---

**Full guide:** `TEAM_SETUP.md`
