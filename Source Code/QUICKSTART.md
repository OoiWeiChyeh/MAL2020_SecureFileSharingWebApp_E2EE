# ⚡ Quick Start Guide

Get Secure Share Web running in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- Firebase account (free tier works)

## 1. Install Dependencies (1 min)

```bash
npm install
```

## 2. Firebase Setup (2 min)

### Option A: Use Existing Configuration (Fastest)

The app is already configured with your Firebase project:
- Project ID: `file-share-f8260`
- Configuration is in `src/firebase.js`

Just ensure Firebase services are enabled:

1. **Enable Authentication:**
   - Go to [Firebase Console](https://console.firebase.google.com/project/file-share-f8260/authentication)
   - Click "Get Started"
   - Enable "Email/Password" method
   - (Optional) Enable "Google" method

2. **Create Firestore Database:**
   - Go to [Firestore](https://console.firebase.google.com/project/file-share-f8260/firestore)
   - Click "Create Database"
   - Start in Production mode
   - Choose any location

3. **Create Storage Bucket:**
   - Go to [Storage](https://console.firebase.google.com/project/file-share-f8260/storage)
   - Click "Get Started"
   - Accept default rules

### Option B: Use Your Own Firebase Project

1. Update `src/firebase.js` with your Firebase config
2. Follow the same steps as Option A for your project

## 3. Deploy Security Rules (1 min)

### Using Firebase CLI:

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
firebase deploy --only firestore:rules,storage:rules
```

### Or Manually:

**Firestore Rules:**
1. Go to Firestore → Rules tab
2. Copy rules from `firestore.rules`
3. Click Publish

**Storage Rules:**
1. Go to Storage → Rules tab
2. Copy rules from `storage.rules`
3. Click Publish

## 4. Start Development Server (1 min)

```bash
npm run dev
```

App will open at: `http://localhost:3000`

## 5. Test the App

### Register a New Account
1. Click "Sign up"
2. Enter email, password, and name
3. Click "Create Account"

### Upload a File
1. Go to Dashboard
2. Click "Upload New File"
3. Select a file (PDF, image, doc, etc.)
4. Click "Upload & Encrypt"

### Share a File
1. Click on a file card
2. Click "Share" button
3. Choose sharing method:
   - **Link:** Copy and share URL
   - **QR Code:** Scan to access file
   - **Email:** Enter recipient email

### Download & Decrypt
1. Open share link in browser
2. Click "Download & Decrypt File"
3. File is decrypted locally and saved

## That's It! 🎉

You now have a fully functional secure file sharing app with end-to-end encryption!

---

## Common Issues

### "Web Crypto API not available"
**Solution:** Use HTTPS or localhost (localhost is considered secure)

### "Permission denied" when uploading
**Solution:** Make sure you deployed the security rules (Step 3)

### "Firebase: Error (auth/provider-not-enabled)"
**Solution:** Enable Email/Password authentication in Firebase Console

---

## Next Steps

- Read [README.md](./README.md) for full feature list
- See [SETUP.md](./SETUP.md) for detailed configuration
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment

## Features Overview

✅ **End-to-End Encryption** (AES-256-GCM)  
✅ **Secure Authentication** (Email + Google)  
✅ **File Upload & Storage**  
✅ **QR Code Sharing**  
✅ **Link Sharing**  
✅ **Local Decryption**  
✅ **Beautiful UI** (TailwindCSS)  
✅ **Mobile Responsive**  
✅ **Zero-Knowledge Architecture**  

---

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Firebase
npm run build && firebase deploy
```

---

## Project Structure

```
src/
├── components/      # Reusable UI components
├── pages/          # Page components (Login, Dashboard, etc.)
├── services/       # Business logic (auth, encryption, storage)
├── utils/          # Helper functions
├── firebase.js     # Firebase configuration
├── App.jsx         # Main app with routing
└── main.jsx        # Entry point
```

---

**Happy Secure Sharing! 🔒**

Need help? Check the documentation or open an issue.
