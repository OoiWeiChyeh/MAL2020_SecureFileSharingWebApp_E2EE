# 🚀 Deployment Guide

Comprehensive guide for deploying Secure Share Web to production.

## Deployment Options

1. **Firebase Hosting** (Recommended)
2. **Vercel**
3. **Netlify**
4. **Custom VPS/Server**

---

## Option 1: Firebase Hosting (Recommended)

### Prerequisites
- Firebase project configured
- Firebase CLI installed: `npm install -g firebase-tools`

### Steps

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting (if not done):**
   ```bash
   firebase init hosting
   ```
   
   Select:
   - Use existing project: `file-share-f8260`
   - Public directory: `dist`
   - Single-page app: `Yes`
   - Overwrite index.html: `No`

4. **Deploy:**
   ```bash
   firebase deploy --only hosting
   ```

5. **Access your app:**
   - Your app will be available at: `https://file-share-f8260.web.app`
   - Or: `https://file-share-f8260.firebaseapp.com`

### Custom Domain Setup

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain (e.g., `secureshare.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (can take up to 24 hours)

### Deploy Script

Add to `package.json`:
```json
{
  "scripts": {
    "deploy": "npm run build && firebase deploy --only hosting"
  }
}
```

Then deploy with:
```bash
npm run deploy
```

---

## Option 2: Vercel

### Steps

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Configure environment variables:**
   - Go to Vercel Dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add Firebase configuration (if using env variables)

5. **Production deployment:**
   ```bash
   vercel --prod
   ```

### Vercel Configuration

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## Option 3: Netlify

### Steps

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy via Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=dist
   ```

3. **Or deploy via GitHub:**
   - Push code to GitHub
   - Connect repository in Netlify Dashboard
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

### Netlify Configuration

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## Option 4: Custom VPS/Server

### Prerequisites
- Ubuntu/Debian server
- Node.js installed
- Nginx installed
- Domain with SSL certificate (Let's Encrypt)

### Steps

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Upload `dist` folder to server:**
   ```bash
   scp -r dist user@your-server:/var/www/secureshare
   ```

3. **Configure Nginx:**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name secureshare.com;
       
       ssl_certificate /etc/letsencrypt/live/secureshare.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/secureshare.com/privkey.pem;
       
       root /var/www/secureshare;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Security headers
       add_header X-Frame-Options "DENY" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header Referrer-Policy "strict-origin-when-cross-origin" always;
       
       # Gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript;
   }
   
   # Redirect HTTP to HTTPS
   server {
       listen 80;
       server_name secureshare.com;
       return 301 https://$server_name$request_uri;
   }
   ```

4. **Restart Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## Post-Deployment Checklist

### Security

- [ ] HTTPS enabled and working
- [ ] Security headers configured
- [ ] Firebase security rules deployed
- [ ] API keys secured (not exposed in client)
- [ ] Firebase App Check enabled (optional)
- [ ] CORS properly configured

### Performance

- [ ] Gzip/Brotli compression enabled
- [ ] Static assets cached
- [ ] CDN configured (optional)
- [ ] Images optimized
- [ ] Bundle size analyzed

### Functionality

- [ ] Authentication working (Email/Password, Google)
- [ ] File upload working
- [ ] File download/decryption working
- [ ] QR code generation working
- [ ] Sharing links working
- [ ] Mobile responsive

### Monitoring

- [ ] Firebase Analytics enabled
- [ ] Error tracking configured (optional: Sentry)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring (optional)

### Testing

- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test file upload
- [ ] Test file download
- [ ] Test file sharing
- [ ] Test on mobile devices
- [ ] Test different browsers

---

## Environment Variables

If using environment variables in production:

### Firebase Hosting
Use `firebase functions:config:set`

### Vercel
Set in Vercel Dashboard → Settings → Environment Variables

### Netlify
Set in Netlify Dashboard → Site settings → Environment variables

### Example Variables
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Rollback Strategy

### Firebase Hosting
View previous deployments:
```bash
firebase hosting:channel:list
```

Rollback:
```bash
firebase hosting:rollback
```

### Vercel
Vercel keeps all deployments - rollback via dashboard or CLI.

### Netlify
Netlify keeps deployment history - rollback via dashboard.

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: file-share-f8260
```

---

## Performance Optimization

### 1. Code Splitting
Already configured with Vite's default settings.

### 2. Lazy Loading
Implement route-based code splitting:
```javascript
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

### 3. Bundle Analysis
```bash
npm install -g vite-bundle-visualizer
vite-bundle-visualizer
```

### 4. Image Optimization
- Use WebP format
- Compress images before upload
- Implement lazy loading for images

---

## Monitoring & Analytics

### Firebase Analytics
Already included in Firebase SDK.

### Google Analytics (Optional)
Add to `index.html`:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## Support & Maintenance

### Regular Updates
```bash
npm outdated
npm update
npm audit fix
```

### Monitor Firebase Usage
- Check Firebase Console → Usage and billing
- Set up budget alerts

### Backup Strategy
- Firestore: Enable automated backups
- Storage: Consider periodic exports

---

## Troubleshooting Production Issues

### Issue: White screen after deployment
**Solution:**
- Check browser console for errors
- Verify all environment variables are set
- Check Firebase configuration

### Issue: 404 on page refresh
**Solution:**
- Configure SPA routing (see platform-specific configs above)

### Issue: Slow loading
**Solution:**
- Enable caching headers
- Use CDN
- Optimize bundle size

---

**Deployment complete! Your secure file sharing app is now live. 🎉**
