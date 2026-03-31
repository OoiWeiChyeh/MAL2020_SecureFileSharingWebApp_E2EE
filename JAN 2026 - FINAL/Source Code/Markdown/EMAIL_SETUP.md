# 📧 Email Notification Setup Guide

This guide will help you set up email notifications for your Exam Paper Management System.

---

## ✅ What's Already Done

1. ✅ Email service created (`src/services/emailService.js`)
2. ✅ Cloud Functions structure created (`functions/`)
3. ✅ Email integration in notification workflow
4. ✅ Email preferences in Settings page
5. ✅ HTML email templates

---

## 🚀 Setup Steps

### Step 1: Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for a free account (100 emails/day free)
3. Verify your email address
4. Create an API Key:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name it: "Firebase Email Service"
   - Give it "Full Access" permissions
   - **Copy the API key** (you'll need it in Step 3)

### Step 2: Upgrade Firebase to Blaze Plan

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `file-share-f8260`
3. Go to Project Settings → Usage and Billing
4. Click "Upgrade to Blaze Plan"
   - **Note**: Blaze plan has a free tier (Spark plan features + pay-as-you-go)
   - You only pay for what you use beyond free limits
   - Cloud Functions free tier: 2 million invocations/month

### Step 3: Install Functions Dependencies

```bash
cd functions
npm install
```

### Step 4: Set SendGrid API Key in Firebase

```bash
# Set SendGrid API key
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"

# Set sender email (optional - defaults to noreply@your-project.firebaseapp.com)
firebase functions:config:set sendgrid.from_email="noreply@yourdomain.com"
```

### Step 5: Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:sendEmailNotification
firebase deploy --only functions:onNotificationCreated
```

---

## 🧪 Testing

### Test in Development

1. Start your app: `npm run dev`
2. Create a notification (submit file, approve, etc.)
3. Check browser console - you should see: `📧 Email Notification (Dev Mode):`
4. Email content will be logged (not actually sent)

### Test in Production

1. Deploy functions: `firebase deploy --only functions`
2. Deploy app: `npm run build && firebase deploy --only hosting`
3. Create a notification in production
4. Check your email inbox
5. Check Firebase Console → Functions → Logs for any errors

---

## 📋 How It Works

### Automatic Email Sending

1. **Notification Created** → Firestore document created
2. **Cloud Function Triggered** → `onNotificationCreated` function runs
3. **User Check** → Checks if user has email notifications enabled
4. **Email Sent** → SendGrid sends email to user
5. **Status Updated** → Notification marked with `emailSent: true`

### Manual Email Sending (Fallback)

If Cloud Function is not available, the frontend will attempt to send emails directly using the `sendEmailNotification` Cloud Function call.

---

## ⚙️ Configuration

### Email Preferences

Users can toggle email notifications in:
- **Settings Page** → Email Notifications section
- Stored in Firestore: `users/{userId}.emailNotificationsEnabled`
- Default: `true` (enabled)

### Email Templates

Email templates are in:
- `src/services/emailService.js` → `generateEmailTemplate()`
- `functions/index.js` → `generateEmailHTML()`

You can customize:
- Colors
- Layout
- Content
- Branding

---

## 🔧 Troubleshooting

### Emails Not Sending

1. **Check SendGrid API Key**
   ```bash
   firebase functions:config:get
   ```

2. **Check Function Logs**
   ```bash
   firebase functions:log
   ```

3. **Check User Email Preferences**
   - User might have disabled email notifications
   - Check Firestore: `users/{userId}.emailNotificationsEnabled`

4. **Check SendGrid Dashboard**
   - Go to SendGrid → Activity
   - See if emails are being sent/rejected

### Common Issues

**Issue**: "Email service error: 401"
- **Fix**: SendGrid API key is invalid or missing

**Issue**: "Email notifications disabled by user"
- **Fix**: User has `emailNotificationsEnabled: false` in their profile

**Issue**: "No email found for user"
- **Fix**: User profile doesn't have an email address

---

## 💰 Cost Estimate

### SendGrid
- **Free Tier**: 100 emails/day
- **Paid**: ~$15/month for 40,000 emails

### Firebase Cloud Functions
- **Free Tier**: 2M invocations/month, 400,000 GB-seconds
- **Paid**: $0.40 per million invocations after free tier

**For a small university** (100 users, ~50 notifications/day):
- SendGrid: Free tier sufficient
- Firebase: Free tier sufficient
- **Total Cost: $0/month** ✅

---

## 📝 Next Steps

1. ✅ Set up SendGrid account
2. ✅ Upgrade Firebase to Blaze
3. ✅ Deploy Cloud Functions
4. ✅ Test email sending
5. ✅ Customize email templates (optional)
6. ✅ Monitor email delivery

---

## 🎨 Customizing Email Templates

Edit email templates in:
- `src/services/emailService.js` (frontend template)
- `functions/index.js` (Cloud Function template)

Change:
- Colors (type-based colors)
- Logo/branding
- Layout
- Content structure

---

**Need Help?** Check Firebase Functions logs or SendGrid Activity dashboard.
