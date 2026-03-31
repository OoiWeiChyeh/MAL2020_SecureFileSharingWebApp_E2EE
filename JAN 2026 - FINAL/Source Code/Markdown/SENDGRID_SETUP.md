# 📧 SendGrid Setup - Step by Step Guide

Follow these steps to get email notifications working.

---

## Step 1: Create SendGrid Account (5 minutes)

1. **Go to SendGrid**: https://sendgrid.com/
2. **Click "Start for Free"** or "Sign Up"
3. **Fill in your details**:
   - Email address
   - Password
   - Company name (optional)
4. **Verify your email** - Check your inbox and click the verification link
5. **Complete setup** - Answer a few questions (optional)

✅ **You now have a SendGrid account!**

---

## Step 2: Create API Key (2 minutes)

1. **Login to SendGrid Dashboard**
2. **Go to Settings** → **API Keys** (left sidebar)
3. **Click "Create API Key"** (top right)
4. **Choose "Full Access"** (or "Restricted Access" with Mail Send permissions)
5. **Name it**: `Firebase Email Service`
6. **Click "Create & View"**
7. **⚠️ IMPORTANT: Copy the API Key NOW** - You won't see it again!
   - It looks like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

✅ **Save this API key somewhere safe!**

---

## Step 3: Upgrade Firebase to Blaze Plan (3 minutes)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `file-share-f8260`
3. **Click the gear icon** (⚙️) → **Project Settings**
4. **Go to "Usage and Billing"** tab
5. **Click "Modify plan"** or "Upgrade"
6. **Select "Blaze Plan"** (Pay as you go)
   - ✅ **Free tier included**: 2M Cloud Function invocations/month
   - ✅ **You only pay for what you use beyond free limits**
   - ✅ **No credit card required for free tier usage**
7. **Complete upgrade** (may need to add payment method, but won't charge unless you exceed free tier)

✅ **Firebase is now on Blaze plan!**

---

## Step 4: Install Functions Dependencies (1 minute)

Open your terminal in the project folder:

```bash
cd "D:\file web"
cd functions
npm install
```

This installs:
- `firebase-admin`
- `firebase-functions`
- `@sendgrid/mail`

✅ **Dependencies installed!**

---

## Step 5: Set SendGrid API Key in Firebase (2 minutes)

**Option A: Using Firebase CLI (Recommended)**

```bash
# Make sure you're in the project root
cd "D:\file web"

# Set the API key
npx firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY_HERE"

# Optional: Set sender email (defaults to noreply@your-project.firebaseapp.com)
npx firebase functions:config:set sendgrid.from_email="noreply@yourdomain.com"
```

**Option B: Using Firebase Console**

1. Go to Firebase Console → Your Project
2. Go to **Functions** → **Config** tab
3. Click **"Add new parameter"**
4. Add:
   - **Key**: `sendgrid.key`
   - **Value**: Your SendGrid API key
5. Click **Save**

✅ **API key configured!**

---

## Step 6: Deploy Cloud Functions (3 minutes)

```bash
# Make sure you're in project root
cd "D:\file web"

# Deploy functions
npx firebase deploy --only functions
```

**What happens:**
- Functions are uploaded to Firebase
- Takes 2-5 minutes
- You'll see deployment progress

✅ **Functions deployed!**

---

## Step 7: Test It! (2 minutes)

1. **Start your app** (if not running):
   ```bash
   npm run dev
   ```

2. **Login to your app**

3. **Create a notification** (e.g., submit a file for review)

4. **Check your email inbox** - You should receive an email!

5. **Check Firebase Console** → **Functions** → **Logs** if emails aren't sending

---

## 🎉 You're Done!

Email notifications are now working! Every time a notification is created, an email will be sent automatically.

---

## 🔧 Troubleshooting

### Emails Not Sending?

1. **Check SendGrid API Key**:
   ```bash
   npx firebase functions:config:get
   ```
   Should show `sendgrid.key`

2. **Check Function Logs**:
   ```bash
   npx firebase functions:log
   ```
   Look for errors

3. **Check SendGrid Dashboard**:
   - Go to SendGrid → **Activity**
   - See if emails are being sent/rejected

4. **Check User Email Preferences**:
   - User might have disabled emails in Settings
   - Check Firestore: `users/{userId}.emailNotificationsEnabled`

### Common Errors

**Error: "Email service error: 401"**
- SendGrid API key is wrong or missing
- Fix: Re-set the API key

**Error: "Email notifications disabled by user"**
- User has `emailNotificationsEnabled: false`
- Fix: User needs to enable in Settings

**Error: "No email found for user"**
- User profile doesn't have email
- Fix: Make sure user has email in their profile

---

## 📊 Cost Estimate

**SendGrid Free Tier:**
- 100 emails/day = 3,000 emails/month
- **Cost: $0/month** ✅

**Firebase Cloud Functions Free Tier:**
- 2M invocations/month
- 400,000 GB-seconds/month
- **Cost: $0/month** (for small usage) ✅

**For your use case** (small university):
- **Total Cost: $0/month** ✅

---

## 🎨 Customize Email Templates

Edit email templates in:
- `src/services/emailService.js` (frontend)
- `functions/index.js` (Cloud Function)

Change colors, layout, branding, etc.

---

**Need help?** Check the logs or SendGrid Activity dashboard!
