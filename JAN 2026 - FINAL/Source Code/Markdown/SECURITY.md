# 🔒 Security Architecture

Comprehensive security documentation for Secure Share Web.

## Table of Contents

1. [Overview](#overview)
2. [Encryption Architecture](#encryption-architecture)
3. [Key Management](#key-management)
4. [Authentication Security](#authentication-security)
5. [Data Flow](#data-flow)
6. [Security Rules](#security-rules)
7. [Threat Model](#threat-model)
8. [Best Practices](#best-practices)
9. [Limitations](#limitations)

---

## Overview

Secure Share Web implements **end-to-end encryption (E2EE)** using the Web Crypto API. This ensures that:

- ✅ Files are encrypted **before** leaving your browser
- ✅ Server **never** sees plaintext data
- ✅ Only authorized users can decrypt files
- ✅ Zero-knowledge architecture

### Security Features

| Feature | Implementation |
|---------|---------------|
| Encryption Algorithm | AES-256-GCM |
| Key Generation | Cryptographically secure random (Web Crypto API) |
| Authentication | Firebase Authentication (Email/Google) |
| Transport Security | HTTPS/TLS |
| Storage | Firebase Cloud Storage (encrypted blobs) |
| Access Control | Firestore Security Rules |

---

## Encryption Architecture

### AES-GCM Encryption

We use **AES-256-GCM** (Advanced Encryption Standard - Galois/Counter Mode):

- **256-bit keys**: Maximum security level
- **GCM mode**: Provides both confidentiality and authenticity
- **12-byte IV**: Random initialization vector per encryption
- **Built-in authentication**: Prevents tampering

### Encryption Flow

```
┌─────────────┐
│  Plain File │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Generate Random Key │ ← Web Crypto API
│    (AES-256)        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Encrypt File       │ ← AES-GCM
│  (+ Random IV)      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Upload Encrypted   │
│  File to Storage    │
└─────────────────────┘
```

### Implementation

```javascript
// Key Generation
const key = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  true,
  ["encrypt", "decrypt"]
);

// Encryption
const iv = crypto.getRandomValues(new Uint8Array(12));
const encrypted = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  key,
  fileData
);
```

---

## Key Management

### Key Generation

- **Per-File Keys**: Each file gets a unique encryption key
- **Cryptographic RNG**: Uses `crypto.getRandomValues()`
- **256-bit entropy**: Maximum security

### Key Storage

```
File Encryption Key
       ↓
Stored in Firestore (plaintext in this implementation)
       ↓
Accessible only to:
  - File owner
  - Users with share access
```

⚠️ **Important:** In this implementation, encryption keys are stored in Firestore. For maximum security, consider:
- Password-based key derivation (PBKDF2)
- User-specific key encryption
- Hardware security modules (HSM)

### Key Sharing

When sharing a file:
1. Key is included in share link (URL parameter)
2. Or stored in Firestore with share permissions
3. Recipient can decrypt with the key

---

## Authentication Security

### Firebase Authentication

- **Email/Password**: bcrypt hashing (Firebase default)
- **Google OAuth**: Secure token-based authentication
- **Session Management**: Firebase handles token refresh
- **Password Requirements**: Minimum 6 characters (configurable)

### Security Measures

```javascript
// Password validation
if (password.length < 6) {
  throw new Error('Password too weak');
}

// Email verification (optional)
await sendEmailVerification(user);
```

### Session Security

- Tokens stored in browser's secure storage
- Auto-expiration and refresh
- Logout clears all local data

---

## Data Flow

### Upload Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. Select File
       ▼
┌─────────────────┐
│ Generate AES Key│
└──────┬──────────┘
       │ 2. Encrypt File
       ▼
┌──────────────────┐
│ Upload Encrypted │ → Firebase Storage
│   Blob (Binary)  │
└──────┬───────────┘
       │ 3. Save Metadata
       ▼
┌──────────────────┐
│   Firestore      │ → Stores:
│   (Metadata)     │    - Filename
└──────────────────┘    - Size
                        - Encryption Key
                        - Owner ID
```

### Download Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. Request File
       ▼
┌──────────────────┐
│   Firestore      │ → Check Permissions
└──────┬───────────┘
       │ 2. Get Metadata + Key
       ▼
┌──────────────────┐
│ Firebase Storage │ → Download Encrypted
└──────┬───────────┘
       │ 3. Download Blob
       ▼
┌──────────────────┐
│ Decrypt Locally  │ ← AES-GCM Decrypt
│  (Web Crypto)    │
└──────┬───────────┘
       │ 4. Save to Device
       ▼
┌─────────────────┐
│  Plaintext File │
└─────────────────┘
```

---

## Security Rules

### Firestore Rules

```javascript
// Owner can read/write their files
allow read, write: if request.auth.uid == resource.data.ownerId;

// Shared users can read
allow read: if request.auth.token.email in resource.data.sharedWith;
```

### Storage Rules

```javascript
// Users can only access their own folder
allow read, write: if request.auth.uid == userId;

// File size limit
allow write: if request.resource.size < 50 * 1024 * 1024; // 50MB
```

---

## Threat Model

### Protected Against

✅ **Man-in-the-Middle (MITM)**
- HTTPS/TLS encryption
- Certificate pinning (browser default)

✅ **Server Compromise**
- Server never sees plaintext data
- Zero-knowledge architecture

✅ **Unauthorized Access**
- Authentication required
- Firestore security rules
- Per-file access control

✅ **Data Tampering**
- AES-GCM provides authentication
- Decryption fails if data modified

✅ **Replay Attacks**
- Unique IV per encryption
- Firebase token validation

### Not Protected Against

⚠️ **Client-Side Attacks**
- Malicious browser extensions
- Compromised user device
- Keyloggers

⚠️ **Weak Passwords**
- Users choose their passwords
- Recommend strong password policy

⚠️ **Phishing**
- Users must verify legitimate domain
- Enable 2FA (if implemented)

⚠️ **Insider Threats (Owner)**
- File owner has full access
- Can share with anyone

⚠️ **Key Exposure**
- Share links contain encryption keys
- Keys visible in URL

---

## Best Practices

### For Developers

1. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

2. **Use HTTPS in Production**
   - Required for Web Crypto API
   - Firebase Hosting provides automatic SSL

3. **Implement Rate Limiting**
   - Prevent brute force attacks
   - Use Firebase App Check

4. **Monitor Security Logs**
   - Firebase Console → Authentication
   - Check for suspicious activity

5. **Regular Security Audits**
   - Review Firebase rules
   - Check for vulnerabilities

### For Users

1. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols

2. **Enable 2FA** (if available)
   - Additional security layer

3. **Verify Share Links**
   - Only open links from trusted sources
   - Check domain before entering credentials

4. **Use Trusted Devices**
   - Avoid public computers
   - Keep device software updated

5. **Secure Share Links**
   - Don't share publicly
   - Use email/private channels

---

## Limitations

### Current Implementation

1. **Keys in Firestore**
   - Keys stored in plaintext in database
   - Accessible to anyone with file access
   - **Mitigation:** Implement password-based key encryption

2. **Keys in URLs**
   - Share links contain keys as URL parameters
   - Visible in browser history
   - **Mitigation:** Use short-lived tokens or POST requests

3. **No Forward Secrecy**
   - Same key used for entire file lifecycle
   - **Mitigation:** Implement key rotation

4. **Client-Side Security**
   - Relies on browser security
   - Vulnerable to XSS (if not careful)
   - **Mitigation:** Strict CSP headers, input sanitization

5. **File Size Limits**
   - Large files consume browser memory
   - **Mitigation:** Stream processing (advanced)

---

## Advanced Security Enhancements

### Future Improvements

1. **Password-Based Key Encryption**
   ```javascript
   // Derive key from user password
   const passwordKey = await deriveKey(userPassword);
   
   // Encrypt file key with password key
   const encryptedFileKey = await encrypt(fileKey, passwordKey);
   ```

2. **Key Rotation**
   - Periodically re-encrypt files with new keys
   - Revoke old keys

3. **Two-Factor Authentication**
   - SMS or authenticator app
   - Firebase supports 2FA

4. **Audit Logging**
   - Log all file access
   - Monitor for suspicious activity

5. **Content Security Policy**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; script-src 'self'">
   ```

6. **Subresource Integrity**
   ```html
   <script src="app.js" 
           integrity="sha384-..." 
           crossorigin="anonymous">
   ```

---

## Security Checklist

Before deploying to production:

- [ ] HTTPS enabled
- [ ] Firebase security rules deployed
- [ ] Strong password policy enforced
- [ ] Input validation implemented
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Error messages don't leak info
- [ ] Dependencies up to date
- [ ] Security audit performed
- [ ] Backup strategy in place
- [ ] Incident response plan ready

---

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email: security@yourdomain.com
3. Provide detailed description
4. Allow time for fix before disclosure

---

## Compliance

### GDPR Considerations

- Users control their data
- Right to deletion (delete account)
- Data portability (export files)
- Privacy by design (E2EE)

### Data Retention

- Files stored until user deletes
- Metadata kept in Firestore
- Can implement auto-deletion

---

## References

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [AES-GCM Specification](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [Firebase Security](https://firebase.google.com/docs/rules)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Security is a journey, not a destination. Stay vigilant! 🔒**
