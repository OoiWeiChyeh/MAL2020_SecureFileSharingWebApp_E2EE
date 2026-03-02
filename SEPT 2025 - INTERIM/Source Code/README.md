# 🎓 University Exam Paper Management System

Secure exam paper management with role-based workflow and version control.

---

## ⚡ Quick Test (No Setup Required!)

**Want to test the system right away?** Visit the live demo:

🔗 **https://file-share-f8260.web.app/login**

### Test Credentials:

| Email | Password | Role |
|-------|----------|------|
| `examunit@admin.com` | `ExamUnit2025!` | Exam Unit (Admin) |
| `Lecture1@test.com` | `test123456` | Lecturer |
| `Hos1@test.com` | `test123456` | HOS (Head of School) |

**Note:** More test accounts available (see [Test Accounts](#-test-accounts) section below)

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone & Install
git clone <repository-url>
cd "file web"
npm install

# 2. Start Emulator (Terminal 1)
npm run emulator

# 3. Create Test Users (first time only, Terminal 2)
node seed-simple.js

# 4. Start App (Terminal 2)
npm run dev
```

**Access:**
- App: http://localhost:3000
- Database: http://localhost:4000
- Login: `lecturer1@test.com` / `test123456`

**👉 New to the team?** Read [TEAM_SETUP.md](./TEAM_SETUP.md)

---

## 📚 Documentation Files

| File | What's Inside |
|------|---------------|
| **TEAM_SETUP.md** | Full setup guide for new developers |
| **QUICK_REFERENCE.md** | Daily commands cheat sheet |
| **SECURITY.md** | Encryption & security details |

---

## 🎯 What This System Does

### **Three Roles:**
- **Exam Unit**: Manage users, final approval, system admin
- **HOS**: Review & approve exam papers for their department
- **Lecturers**: Create and upload exam papers

### **Workflow:**
```
Lecturer uploads exam paper
         ↓
HOS reviews & approves
         ↓
Exam Unit final approval
         ↓
Ready for printing
```

### **Features:**
- ✅ Version control (track all file versions)
- ✅ File timeline (see who changed what)
- ✅ AES-256 encryption
- ✅ Department isolation
- ✅ Approval workflow
- ✅ Download history

---

## 🏗️ Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Encryption**: AES-256-GCM (Web Crypto API)
- **Development**: Firebase Emulator Suite

---

## 🔧 Tech Details

### **Project Structure:**
```
file-web/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page views
│   ├── services/      # Firebase/API services
│   └── utils/         # Helper functions
├── firebase.json      # Firebase config
├── firestore.rules    # Database security
├── seed-simple.js     # Create test users
└── package.json       # Dependencies
```

### **Database (Firestore):**
- `users/` - User profiles & roles
- `files/` - File metadata
- `fileVersions/` - Version history
- `departments/` - Departments & courses
- `subjects/` - Subject assignments

### **Local Development:**
- Runs entirely on localhost
- No cloud connection needed
- Data persists between sessions
- Saved in `emulator-data/` folder

---

## 📝 Common Commands

```bash
# Daily work
npm run emulator          # Start emulator
npm run dev              # Start app

# Fresh start (reset data)
npm run emulator:fresh
node seed-simple.js

# Build for production
npm run build
firebase deploy
```

---

## 🐛 Common Issues

### Port 8080 taken?
```powershell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Data disappeared?
Use `npm run emulator` (NOT `firebase emulators:start`)

### Need fresh data?
```bash
npm run emulator:fresh
node seed-simple.js
```

---

## 📖 More Info

- **Setup Help**: [TEAM_SETUP.md](./TEAM_SETUP.md)
- **Quick Commands**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Security Details**: [SECURITY.md](./SECURITY.md)

---

## 👥 Test Accounts

### **For Local Development (Emulator):**

All passwords: `test123456`

| Email | Role |
|-------|------|
| examunit@test.com | Exam Unit (Admin) |
| hos.cs@test.com | HOS (Computer Science) |
| lecturer1@test.com | Lecturer (CS) |

See [TEAM_SETUP.md](./TEAM_SETUP.md) for full list.

### **For Hosted Demo:**

See [Quick Test](#-quick-test-no-setup-required) section above.

---

## 🚀 Deployment

**Only team lead deploys to production:**
```bash
firebase login
npm run build
firebase deploy
```

---

**Start here:** [TEAM_SETUP.md](./TEAM_SETUP.md) 📖
