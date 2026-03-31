# Encryption Algorithm Explained

## Overview

This system uses **AES-256-GCM** encryption to protect files. Files are encrypted in your browser before upload, and decrypted in your browser after download.

## What is AES-256-GCM?

- **AES** = Advanced Encryption Standard (industry standard)
- **256** = 256-bit key (very strong, 2^256 possible keys)
- **GCM** = Galois/Counter Mode (provides encryption + authentication)

## How It Works

### 1. Key Generation
```
When you upload a file:
→ System generates a random 256-bit key
→ Key is unique for each file
→ Stored in Firestore (encrypted database)
```

### 2. Encryption Process
```
Plain File
    ↓
Generate Random IV (12 bytes) - makes each encryption unique
    ↓
Encrypt with AES-256-GCM using the key + IV
    ↓
Encrypted File (IV + encrypted data)
    ↓
Upload to Firebase Storage
```

### 3. Decryption Process
```
Download Encrypted File
    ↓
Extract IV from beginning (first 12 bytes)
    ↓
Get encryption key from Firestore
    ↓
Decrypt using AES-256-GCM
    ↓
Original File
```

## Key Points

✅ **Client-Side Only**: Encryption/decryption happens in your browser, server never sees plaintext

✅ **Unique Keys**: Each file gets its own random encryption key

✅ **Random IV**: Each encryption uses a unique Initialization Vector (prevents pattern attacks)

✅ **Authenticated**: GCM mode detects if file was tampered with

✅ **Secure Storage**: Keys stored in Firestore (Firebase database) with access control

## Technical Details

- **Algorithm**: AES-GCM
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 12 bytes (96 bits)
- **Key Format**: Base64 encoded
- **API**: Web Crypto API (built into modern browsers)

## Security Level

- **AES-256**: Used by banks, military, and governments
- **GCM Mode**: Provides both confidentiality and integrity
- **Random IV**: Ensures same file encrypted twice produces different ciphertext

## Code Example

```javascript
// Generate key
const key = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  true,
  ["encrypt", "decrypt"]
);

// Encrypt
const iv = crypto.getRandomValues(new Uint8Array(12));
const encrypted = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  key,
  fileData
);

// Result: [IV (12 bytes)][Encrypted Data]
```

## Why This is Secure

1. **Strong Algorithm**: AES-256 is unbreakable with current technology
2. **Unique Per File**: Even if one key is compromised, others are safe
3. **Random IV**: Prevents pattern analysis attacks
4. **Client-Side**: Server can't decrypt files even if compromised
5. **Authenticated**: Detects unauthorized modifications
