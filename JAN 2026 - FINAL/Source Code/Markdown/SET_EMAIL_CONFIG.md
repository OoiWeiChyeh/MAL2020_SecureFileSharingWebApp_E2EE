# 🔧 Set Your Email in Firebase Config

## After verifying your email in SendGrid, run this:

```powershell
cd "D:\file web"
npx firebase functions:config:set sendgrid.from_email="YOUR-VERIFIED-EMAIL@example.com"
npx firebase deploy --only functions
```

## Example:

If your verified email is `john.doe@gmail.com`:

```powershell
npx firebase functions:config:set sendgrid.from_email="john.doe@gmail.com"
npx firebase deploy --only functions
```

---

## ✅ Then test again!

After deploying, test on your live site and emails should work!
