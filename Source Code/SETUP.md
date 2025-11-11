# 🚀 Setup Guide - Secure Share Web

Complete setup instructions for the Secure Share Web application.

## Prerequisites

- **Node.js** 16.x or higher
- **npm** 8.x or higher
- **Firebase Account** (free tier is sufficient)
- **Modern Web Browser** with Web Crypto API support

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages:
- React 18
- Firebase SDK
- React Router
- TailwindCSS
- QR Code generation library
- And more...

## Step 2: Firebase Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `Secure File Share Web` (or any name)
4. Follow the setup wizard

### 2.2 Enable Firebase Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** sign-in method
4. (Optional) Enable **Google** sign-in method

### 2.3 Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create Database**
3. Start in **Production Mode**
4. Choose a location (closest to your users)

### 2.4 Create Storage Bucket

1. Go to **Storage**
2. Click **Get Started**
3. Start in **Production Mode**

### 2.5 Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click **Web** icon (</>) to add a web app
4. Register app with nickname: `Secure Share Web`
5. Copy the Firebase configuration object

**Note:** The configuration is already set in `src/firebase.js` with your project details. If you need to change it, update that file.

## Step 3: Deploy Security Rules

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

Or manually copy rules from `firestore.rules` to Firebase Console:
1. Go to **Firestore Database** → **Rules**
2. Copy contents from `firestore.rules`
3. Click **Publish**

### Deploy Storage Rules

```bash
firebase deploy --only storage:rules
```

Or manually:
1. Go to **Storage** → **Rules**
2. Copy contents from `storage.rules`
3. Click **Publish**

## Step 4: Configure Environment (Optional)

If you want to use environment variables instead of hardcoded config:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase credentials in `.env`

3. Update `src/firebase.js` to use environment variables:
   ```javascript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     // ... etc
   };
   ```

## Step 5: Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Step 6: Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

## Step 7: Deploy to Firebase Hosting (Optional)

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Login to Firebase

```bash
firebase login
```

### Initialize Firebase Hosting

```bash
firebase init hosting
```

Select:
- Use existing project
- Public directory: `dist`
- Single-page app: **Yes**
- Automatic builds: **No**

### Deploy

```bash
npm run build
firebase deploy --only hosting
```

Your app will be live at: `https://your-project.web.app`

## Troubleshooting

### Web Crypto API Not Available

**Problem:** Browser doesn't support Web Crypto API

**Solution:**
- Use HTTPS (required for Web Crypto API)
- Use a modern browser (Chrome, Firefox, Safari, Edge)
- In development, `localhost` is considered secure

### Firebase Authentication Errors

**Problem:** "Email/Password provider not enabled"

**Solution:**
- Enable Email/Password in Firebase Console → Authentication → Sign-in method

### Storage Upload Fails

**Problem:** Permission denied when uploading files

**Solution:**
- Deploy storage rules: `firebase deploy --only storage`
- Verify rules allow authenticated users to upload

### CORS Errors

**Problem:** CORS errors when downloading files

**Solution:**
- Firebase Storage automatically handles CORS
- Ensure you're using the download URL from Firebase, not direct bucket access

### Firestore Permission Denied

**Problem:** Can't read/write to Firestore

**Solution:**
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Ensure user is authenticated before accessing Firestore

## Next Steps

1. **Enable Google Sign-In:**
   - Add SHA-1 fingerprint in Firebase Console
   - Configure OAuth consent screen

2. **Enable Firebase App Check:**
   - Protects your backend from abuse
   - Go to Firebase Console → App Check

3. **Set up Firebase Analytics:**
   - Track user engagement and usage

4. **Configure Custom Domain:**
   - Add custom domain in Firebase Hosting settings

5. **Enable Rate Limiting:**
   - Protect against abuse with Firebase Security Rules

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Enable App Check** - Prevent unauthorized access
3. **Use HTTPS in production** - Required for Web Crypto API
4. **Regularly update dependencies** - `npm audit` and `npm update`
5. **Monitor Firebase usage** - Set up billing alerts
6. **Implement rate limiting** - Prevent abuse
7. **Review security rules regularly** - Ensure proper access control

## Support

For issues or questions:
- Check the [README.md](./README.md) for features and usage
- Review Firebase documentation
- Check browser console for errors

---

Built with ❤️ for secure file sharing
