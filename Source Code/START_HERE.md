# 🚀 START HERE - Get Your App Running Now!

## ⚡ Super Quick Start (3 Commands)

```bash
# 1. Install dependencies
npm install

# 2. Start the app
npm run dev

# 3. Open browser to: http://localhost:3000
```

**⚠️ Important:** Before the app works fully, you need to enable Firebase services (see below).

---

## 📋 Pre-Launch Checklist

### ✅ Step 1: Install Node Packages (1 minute)

Open your terminal in this directory and run:

```bash
npm install
```

This installs React, Firebase, TailwindCSS, and all dependencies.

### ✅ Step 2: Enable Firebase Services (2 minutes)

Your Firebase project is **already configured** in `src/firebase.js`:
- **Project ID:** `file-share-f8260`
- **App ID:** `1:507853509059:web:17981215ff209ef15bed76`

You just need to **enable the services**:

#### 2a. Enable Authentication
1. Visit: https://console.firebase.google.com/project/file-share-f8260/authentication
2. Click **"Get Started"**
3. Click **"Email/Password"** → Enable it → Save
4. (Optional) Click **"Google"** → Enable it → Save

#### 2b. Create Firestore Database
1. Visit: https://console.firebase.google.com/project/file-share-f8260/firestore
2. Click **"Create Database"**
3. Select **"Production mode"**
4. Choose any location (select closest to you)
5. Click **"Enable"**

#### 2c. Create Storage Bucket
1. Visit: https://console.firebase.google.com/project/file-share-f8260/storage
2. Click **"Get Started"**
3. Select **"Production mode"**
4. Use default location
5. Click **"Done"**

### ✅ Step 3: Deploy Security Rules (1 minute)

Your security rules are already written. Deploy them:

#### Option A: Using Firebase CLI (Recommended)

```bash
# Install Firebase CLI globally (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules
firebase deploy --only firestore:rules,storage:rules
```

#### Option B: Manual Copy-Paste

**For Firestore Rules:**
1. Go to: https://console.firebase.google.com/project/file-share-f8260/firestore/rules
2. Copy everything from the `firestore.rules` file in this project
3. Paste it into the rules editor in Firebase Console
4. Click **"Publish"**

**For Storage Rules:**
1. Go to: https://console.firebase.google.com/project/file-share-f8260/storage/rules
2. Copy everything from the `storage.rules` file in this project
3. Paste it into the rules editor
4. Click **"Publish"**

### ✅ Step 4: Start the App! (Instant)

```bash
npm run dev
```

**Your app will open at:** http://localhost:3000

---

## 🎯 Test Your App (5 minutes)

### Test 1: Register a New Account

1. You'll see the login page
2. Click **"Sign up"** at the bottom
3. Enter:
   - **Name:** Your Name
   - **Email:** your@email.com
   - **Password:** At least 6 characters
4. Click **"Create Account"**
5. ✅ You should be redirected to the Dashboard

### Test 2: Upload a File

1. On the Dashboard, click the blue **"Upload New File"** card
2. Click **"Click to upload or drag and drop"**
3. Select any file (PDF, image, document)
4. Click **"Upload & Encrypt"**
5. Watch the progress bar (encryption happens in real-time)
6. ✅ You'll be redirected to Dashboard with your file listed

### Test 3: Share a File

1. On Dashboard, click on your uploaded file
2. Click the **"Share"** button (share icon)
3. You'll see three tabs:
   - **Share Link:** Click "Copy" to copy the link
   - **QR Code:** A QR code is generated
   - **By Email:** Enter an email to share
4. ✅ Copy the link and paste it in a new browser window

### Test 4: Download & Decrypt

1. Open the share link (from Test 3) in a new browser tab
2. You'll see the file information page
3. Click **"Download & Decrypt File"**
4. Watch as the file is:
   - Downloaded from Firebase (encrypted)
   - Decrypted in your browser
   - Saved to your Downloads folder
5. ✅ Open the downloaded file - it should work perfectly!

### Test 5: Try QR Code (if you have a phone)

1. Share a file (Test 3)
2. Switch to the **"QR Code"** tab
3. Scan the QR code with your phone's camera
4. The file page opens on your phone
5. ✅ Download and decrypt on mobile!

---

## ✅ Success Indicators

Your app is working correctly if you can:

- ✅ Register and login without errors
- ✅ See the Dashboard with statistics (0 files initially)
- ✅ Upload a file and see a progress bar
- ✅ See the uploaded file appear on Dashboard
- ✅ Click share and generate a link/QR code
- ✅ Open the share link and download the file
- ✅ The downloaded file opens correctly (not corrupted)
- ✅ Mobile menu works on small screens

---

## 🚨 Troubleshooting

### Problem: "npm install" fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules if it exists
rmdir /s node_modules        # Windows
rm -rf node_modules          # Mac/Linux

# Try again
npm install
```

### Problem: "Permission denied" when uploading

**Cause:** Security rules not deployed

**Solution:**
- Make sure you completed Step 3 (Deploy Security Rules)
- Check Firebase Console → Firestore → Rules (should see your rules)
- Check Firebase Console → Storage → Rules (should see your rules)

### Problem: "Web Crypto API not available"

**Cause:** Not using HTTPS or modern browser

**Solution:**
- In development, use `http://localhost:3000` (localhost is considered secure)
- Use a modern browser: Chrome, Firefox, Safari, or Edge
- Update your browser to the latest version

### Problem: "Firebase: Error (auth/email-already-in-use)"

**Cause:** Email already registered

**Solution:**
- Use a different email
- Or go to Login page and sign in with existing account

### Problem: Files not uploading

**Check:**
1. Browser console for errors (F12 → Console tab)
2. File size < 50MB
3. File type is supported (PDF, DOCX, PNG, JPG, TXT, ZIP, MP4, MP3)
4. You're logged in (check if Navbar shows your name)
5. Firebase Storage is enabled

### Problem: Can't decrypt files

**Check:**
1. Encryption key is in the URL (should see `?id=...&key=...`)
2. Browser console for errors
3. File wasn't corrupted during upload (try re-uploading)

---

## 📱 Browser Requirements

✅ **Works on:**
- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+
- Opera 67+

❌ **Does NOT work on:**
- Internet Explorer (any version)
- Very old mobile browsers

---

## 🔐 How It Works (Quick Overview)

### When You Upload:
1. You select a file
2. Browser generates a random 256-bit encryption key
3. File is encrypted in your browser (AES-256-GCM)
4. Encrypted blob uploaded to Firebase Storage
5. Encryption key and metadata saved to Firestore

### When You Download:
1. You open a share link
2. Encrypted file downloaded from Firebase
3. File decrypted in your browser using the key
4. Decrypted file saved to your device

### Security:
- Server **never** sees your files in plaintext
- All encryption happens in your browser
- Only you and people you share with can decrypt files

---

## 📖 Next Steps

### Learn More:
- **Features:** See [README.md](./README.md)
- **Detailed Setup:** See [SETUP.md](./SETUP.md)
- **Security Details:** See [SECURITY.md](./SECURITY.md)
- **Architecture:** See [ARCHITECTURE.md](./ARCHITECTURE.md)

### Deploy to Production:
- **How to Deploy:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

### Complete Guide:
- **Everything:** See [INSTRUCTIONS.md](./INSTRUCTIONS.md)

---

## 🎉 You're All Set!

Your secure file sharing app is now running. Here's what you can do:

1. **Upload files** - Encrypt and store securely
2. **Share files** - Via link, QR code, or email
3. **Download files** - Decrypt locally in browser
4. **Manage files** - View, share, delete from Dashboard
5. **Settings** - Manage your profile

---

## 📊 Quick Reference

### Important URLs

**Development:**
- App: http://localhost:3000
- Firebase Console: https://console.firebase.google.com/project/file-share-f8260

**Production (after deployment):**
- Live App: https://file-share-f8260.web.app
- Alt URL: https://file-share-f8260.firebaseapp.com

### Key Commands

```bash
npm install              # Install dependencies
npm run dev              # Start development server
npm run build            # Build for production
firebase login           # Login to Firebase CLI
firebase deploy          # Deploy to Firebase Hosting
```

### Project Structure

```
src/
├── pages/              # Login, Dashboard, Upload, Share, etc.
├── components/         # Navbar, FileCard
├── services/          # Auth, Encryption, Storage, Firestore
└── utils/             # Helper functions
```

---

## 💡 Pro Tips

1. **Use Strong Passwords:** At least 12 characters
2. **Don't Share Links Publicly:** They contain decryption keys
3. **Test on Mobile:** App is fully responsive
4. **Check Console:** Browser DevTools (F12) for debugging
5. **Update Regularly:** Run `npm update` to get latest packages

---

## 🆘 Need Help?

### Documentation Files:
- `START_HERE.md` ← You are here
- `QUICKSTART.md` - Fast 5-minute guide
- `INSTRUCTIONS.md` - Complete walkthrough
- `PROJECT_SUMMARY.md` - What was built
- `FILE_TREE.txt` - Full project structure

### Check Browser Console:
Press **F12** → **Console** tab to see errors

### Firebase Console:
Check your Firebase project for any errors or warnings

---

## ✅ Final Checklist

Before you're done, make sure:

- [x] `npm install` completed successfully
- [x] Firebase Authentication enabled
- [x] Firestore Database created
- [x] Storage bucket created
- [x] Security rules deployed
- [x] `npm run dev` running
- [x] App opens at localhost:3000
- [x] You can register/login
- [x] You can upload files
- [x] You can share files
- [x] You can download files

---

**🎊 Congratulations! Your secure file sharing app is ready!**

**Questions? Check the documentation files or Firebase Console.**

**Happy secure sharing! 🔒**
