# 🔐 Secure Share Web

A cybersecurity-focused file sharing web application with **end-to-end encryption (E2EE)**, built with React and Firebase.

## ✨ Features

- **End-to-End Encryption**: All files encrypted client-side using Web Crypto API (AES-GCM 256-bit)
- **Secure Authentication**: Firebase Authentication with email/password and Google sign-in
- **Encrypted File Storage**: Store encrypted files on Firebase Storage
- **Secure Sharing**: Share files via QR code or encrypted links
- **Offline Decryption**: Downloaded files can be decrypted locally
- **Zero-Knowledge Architecture**: Server never sees plaintext data or encryption keys

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Firebase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

### Firebase Setup

The app is pre-configured with Firebase. To use your own Firebase project:

1. Update `src/firebase.js` with your Firebase configuration
2. Enable Authentication (Email/Password and Google)
3. Create Firestore Database
4. Create Storage bucket
5. Deploy the security rules (see below)

### Security Rules

**Firestore Rules** (`firestore.rules`):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /files/{fileId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Storage Rules** (`storage.rules`):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🔒 Security Architecture

### Encryption Flow

1. **Upload**: 
   - Generate unique AES-256 key per file
   - Encrypt file in browser using Web Crypto API
   - Upload encrypted file to Firebase Storage
   - Store encrypted key and metadata in Firestore

2. **Share**:
   - Generate shareable link with encrypted key
   - Create QR code containing encrypted key
   - Grant access in Firestore

3. **Download & Decrypt**:
   - Retrieve encrypted file from Storage
   - Get encrypted key from Firestore
   - Decrypt locally in browser
   - Save decrypted file

### Security Features

- ✅ Client-side encryption/decryption only
- ✅ No plaintext data on server
- ✅ Unique encryption key per file
- ✅ Secure key sharing via QR/link
- ✅ HTTPS enforced
- ✅ Input sanitization
- ✅ Session management

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
├── pages/             # Page components
├── services/          # Business logic (auth, encryption, storage)
├── utils/             # Helper functions and constants
├── firebase.js        # Firebase configuration
├── App.jsx            # Main app component
└── main.jsx           # Entry point
```

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **UI**: TailwindCSS + Lucide Icons
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Encryption**: Web Crypto API (AES-GCM)
- **QR Codes**: qrcode.react
- **Routing**: React Router v6

## 📱 Usage

1. **Register/Login**: Create an account or sign in
2. **Upload Files**: Select files to encrypt and upload
3. **View Dashboard**: See your files and files shared with you
4. **Share Files**: Generate QR codes or shareable links
5. **Download & Decrypt**: Retrieve and decrypt files locally

## 🎯 Use Cases

- Secure document sharing within teams
- Confidential file transfer
- Privacy-focused file storage
- Cybersecurity education and demonstration
- Zero-trust file sharing

## ⚠️ Security Considerations

- Always use HTTPS in production
- Keep Firebase API keys secured (use environment variables)
- Regularly update dependencies
- Implement rate limiting on Firebase
- Use strong passwords for authentication
- Enable Firebase App Check for abuse prevention

## 📄 License

This project is for educational and demonstration purposes.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Built with ❤️ for secure file sharing
