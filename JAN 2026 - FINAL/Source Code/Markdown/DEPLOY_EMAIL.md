# 🚀 Deploy Email Functions - Quick Guide

## ✅ What's Done
- ✅ SendGrid API key configured
- ✅ Functions dependencies installed
- ✅ Functions code ready

## ⚠️ Before Deploying

### 1. Upgrade Firebase to Blaze Plan (Required)

1. Go to: https://console.firebase.google.com/project/file-share-f8260/settings/usage
2. Click "Modify plan" or "Upgrade"
3. Select **Blaze Plan** (Pay as you go)
   - ✅ Free tier: 2M function invocations/month
   - ✅ Only pay if you exceed free limits
   - ⚠️ May need to add payment method (won't charge unless you exceed free tier)

### 2. Deploy Functions

Once Blaze plan is active, run:

```powershell
cd "D:\file web"
npx firebase deploy --only functions
```

This will:
- Upload your functions to Firebase
- Take 2-5 minutes
- Show deployment progress

### 3. Test

After deployment:
1. Start your app: `npm run dev`
2. Create a notification (submit file, approve, etc.)
3. Check your email inbox!

---

## 📊 Check Deployment Status

```powershell
# View function logs
npx firebase functions:log

# Check if functions are deployed
npx firebase functions:list
```

---

## 🎉 You're Done!

Once deployed, emails will send automatically when notifications are created!
