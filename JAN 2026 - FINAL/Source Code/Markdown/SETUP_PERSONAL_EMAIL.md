# 📧 Setup Email with Your Personal Email

## ✅ Use Your Personal Email (Gmail, Outlook, etc.)

The `noreply@file-share-f8260.firebaseapp.com` email doesn't exist - you need to use **your real email** that you can verify.

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Verify Your Email in SendGrid

1. **Go to SendGrid**: https://app.sendgrid.com/
2. **Settings** → **Sender Authentication** → **Verify a Single Sender**
3. **Fill in the form**:
   - **From Email**: Your personal email (e.g., `yourname@gmail.com`)
   - **From Name**: `Exam Paper Management System`
   - **Reply To**: Same as From Email
   - **Company Address**: Your address
   - **City, State, Zip**: Your location
   - **Country**: Your country
4. **Click "Create"**
5. **Check your email inbox** - SendGrid will send a verification email
6. **Click the verification link** in the email

✅ **Your email is now verified!**

---

### Step 2: Set Your Email in Firebase

After verification, run this command (replace with YOUR verified email):

```powershell
cd "D:\file web"
npx firebase functions:config:set sendgrid.from_email="your-email@gmail.com"
```

**Example:**
```powershell
npx firebase functions:config:set sendgrid.from_email="john.doe@gmail.com"
```

---

### Step 3: Deploy Functions

```powershell
npx firebase deploy --only functions
```

---

### Step 4: Test!

1. Go to your live site: https://file-share-f8260.web.app
2. Create a notification (submit file, approve, etc.)
3. Check your email inbox - you should receive the email!

---

## 📝 Notes

- ✅ **Use your personal email** (Gmail, Outlook, Yahoo, etc.)
- ✅ **Must verify it in SendGrid** first
- ✅ **Emails will come FROM your personal email**
- ✅ **Free tier**: 100 emails/day

---

## 🎯 What Email to Use?

**Best options:**
1. **Your Gmail** - `yourname@gmail.com` ✅
2. **Your Outlook** - `yourname@outlook.com` ✅
3. **Your University Email** - `yourname@university.edu` ✅ (if you have one)

**Don't use:**
- ❌ `noreply@file-share-f8260.firebaseapp.com` (doesn't exist)
- ❌ Any email you can't access/verify

---

## ✅ That's It!

Once you verify your email and set it in Firebase, emails will work perfectly!
