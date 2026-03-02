# 🎤 Presentation Code Reference Guide

**Quick navigation guide for code locations during your presentation**

---

## 📋 Table of Contents

1. [User Workflows](#user-workflows)
2. [Core Features](#core-features)
3. [File Structure](#file-structure)
4. [Key Functions Quick Reference](#key-functions-quick-reference)
5. [Common Questions & Answers](#common-questions--answers)

---

## 👤 User Workflows

### **Lecturer Workflow**

#### 1. **Upload Exam Paper**
- **Page**: `src/pages/Upload.jsx`
- **Main Function**: `handleUpload()` (line ~90)
- **What it does**:
  - Validates file type/size
  - Generates encryption key
  - Encrypts file in browser
  - Uploads to Firebase Storage
  - Saves metadata to Firestore
- **Key Services Used**:
  - `encryptionService.js` → `generateAESKey()`, `encryptFile()`
  - `storageService.js` → `uploadEncryptedFile()`
  - `firestoreService.js` → `saveFileMetadata()`

#### 2. **View My Files**
- **Page**: `src/pages/Dashboard.jsx`
- **Function**: `loadFiles()` (Lecturer section)
- **Service**: `firestoreService.js` → `getUserFiles(userId)`

#### 3. **Submit for Review**
- **Page**: `src/pages/Dashboard.jsx` (FileCard component)
- **Function**: `handleSubmitForReview()` in `FileCard.jsx`
- **Service**: `firestoreService.js` → `submitFileForReview()`

#### 4. **Upload New Version**
- **Component**: `src/components/UploadNewVersionModal.jsx`
- **Service**: `firestoreService.js` → `uploadNewFileVersion()`

---

### **HOS (Head of School) Workflow**

#### 1. **Review Files from Department**
- **Page**: `src/pages/HOSReview.jsx`
- **Function**: `loadReviewFiles()` (line ~50)
- **Service**: `firestoreService.js` → `getHOSReviewFiles(departmentId)`

#### 2. **Approve File**
- **Page**: `src/pages/HOSReview.jsx`
- **Function**: `handleApprove()` (line ~150)
- **Service**: `firestoreService.js` → `hosApproveFile()`

#### 3. **Request Revision**
- **Page**: `src/pages/HOSReview.jsx`
- **Function**: `handleRequestRevision()` (line ~200)
- **Service**: `firestoreService.js` → `hosRejectFile()` (renamed to request revision)

---

### **Exam Unit Workflow**

#### 1. **Review All Files**
- **Page**: `src/pages/ExamUnitReview.jsx`
- **Function**: `loadReviewFiles()` (line ~100)
- **Service**: `firestoreService.js` → `getExamUnitReviewFiles()`

#### 2. **Final Approval**
- **Page**: `src/pages/ExamUnitReview.jsx`
- **Function**: `handleApprove()` (line ~200)
- **Service**: `firestoreService.js` → `examUnitApproveFile()`

#### 3. **Request Revision**
- **Page**: `src/pages/ExamUnitReview.jsx`
- **Function**: `handleRequestRevision()` (line ~250)
- **Service**: `firestoreService.js` → `examUnitRejectFile()`

#### 4. **Manage Users & Departments**
- **Page**: `src/pages/AdminPanel.jsx`
- **Key Functions**:
  - Create/Edit/Delete Users → `firestoreService.js` → `updateUser()`, `deleteUser()`
  - Manage Departments → `firestoreService.js` → `createDepartment()`, `updateDepartment()`, `deleteDepartment()`
  - Assign Lecturers → `firestoreService.js` → `assignLecturerToSubject()`

---

## 🔐 Core Features

### **1. End-to-End Encryption (E2EE)**

**Location**: `src/services/encryptionService.js`

**Key Functions**:
- `generateAESKey()` (line 7) - Generates 256-bit AES key
- `encryptFile(file, base64Key)` (line 32) - Encrypts file using AES-256-GCM
- `decryptFile(encryptedData, base64Key)` (line 76) - Decrypts file in browser

**How it works**:
1. User selects file → `Upload.jsx` calls `generateAESKey()`
2. File encrypted in browser → `encryptFile()` before upload
3. Encrypted blob uploaded to Storage
4. Key stored in Firestore metadata
5. Download: Encrypted file → `decryptFile()` → Saved locally

**Algorithm**: AES-256-GCM (Web Crypto API)

---

### **2. File Upload & Storage**

**Upload Flow**:
- **Page**: `src/pages/Upload.jsx` → `handleUpload()`
- **Encryption**: `encryptionService.js` → `encryptFile()`
- **Storage**: `storageService.js` → `uploadEncryptedFile()`
- **Metadata**: `firestoreService.js` → `saveFileMetadata()`

**Storage Path**: `users/{userId}/{fileId}/{filename}.enc`

---

### **3. File Download**

**Location**: `src/components/FileCard.jsx` → `handleDownload()`

**Process**:
1. Get file metadata from Firestore
2. Download encrypted blob from Storage → `storageService.js` → `downloadEncryptedFile()`
3. Decrypt in browser → `encryptionService.js` → `decryptFile()`
4. Save to user's device
5. Record download → `firestoreService.js` → `recordDownload()`

---

### **4. Version Control**

**Component**: `src/components/VersionHistoryModal.jsx`

**Services**:
- `firestoreService.js` → `getFileVersions(fileId)` - Get all versions
- `firestoreService.js` → `createFileVersion()` - Create new version
- `firestoreService.js` → `uploadNewFileVersion()` - Upload new version

**Storage**: Each version stored separately in Storage

---

### **5. Approval Workflow**

**Status Flow**:
```
DRAFT → PENDING_HOS_REVIEW → PENDING_EXAM_UNIT → APPROVED
         ↓ (if revision needed)
      NEEDS_REVISION
```

**Key Functions**:
- Submit: `firestoreService.js` → `submitFileForReview()`
- HOS Approve: `firestoreService.js` → `hosApproveFile()`
- HOS Reject: `firestoreService.js` → `hosRejectFile()` (Request Revision)
- Exam Unit Approve: `firestoreService.js` → `examUnitApproveFile()`
- Exam Unit Reject: `firestoreService.js` → `examUnitRejectFile()` (Request Revision)

**Location**: Status tracked in `files` collection → `workflowStatus` field

---

### **6. Notifications**

**Service**: `src/services/notificationService.js`

**Key Functions**:
- `createNotification()` - Create notification
- `getNotificationsForUser()` - Get user's notifications
- `markNotificationAsRead()` - Mark as read
- `clearAllNotifications()` - Clear all notifications

**Component**: `src/components/NotificationsPanel.jsx`

**Triggered by**:
- File submitted → Notify HOS
- HOS approves → Notify Exam Unit
- Exam Unit approves → Notify Lecturer
- Revision requested → Notify Lecturer

---

### **7. Download History**

**Location**: `src/components/FileCard.jsx` → `handleShowHistory()`

**Service**: `firestoreService.js` → `getDownloadHistory(fileId)`

**Data**: Stored in `files/{fileId}/downloadHistory` array

---

### **8. File Timeline**

**Component**: `src/components/FileTimelineModal.jsx`

**Shows**: Upload, approvals, revisions, downloads with timestamps

---

## 📁 File Structure

### **Pages** (`src/pages/`)
- `Login.jsx` - User authentication
- `Register.jsx` - User registration
- `Dashboard.jsx` - Main dashboard (role-specific views)
- `Upload.jsx` - File upload page (Lecturers only)
- `HOSReview.jsx` - HOS review page
- `ExamUnitReview.jsx` - Exam Unit review page
- `AdminPanel.jsx` - User & department management
- `ViewFile.jsx` - View file details
- `Settings.jsx` - User settings

### **Components** (`src/components/`)
- `FileCard.jsx` - File display card with actions
- `Navbar.jsx` - Navigation bar
- `NotificationsPanel.jsx` - Notifications dropdown
- `VersionHistoryModal.jsx` - Version history viewer
- `FileTimelineModal.jsx` - File timeline viewer
- `UploadNewVersionModal.jsx` - Upload new version modal

### **Services** (`src/services/`)
- `encryptionService.js` - All encryption/decryption functions
- `storageService.js` - Firebase Storage operations
- `firestoreService.js` - Firestore database operations
- `authService.js` - Authentication functions
- `notificationService.js` - Notification management

### **Utils** (`src/utils/`)
- `constants.js` - App constants (file types, sizes, etc.)
- `helpers.js` - Helper functions (validation, formatting)

---

## 🔍 Key Functions Quick Reference

### **Authentication**
- `authService.js` → `loginUser(email, password)`
- `authService.js` → `registerUser(email, password, displayName)`
- `authService.js` → `getCurrentUser()`
- `authService.js` → `logoutUser()`

### **File Operations**
- `firestoreService.js` → `getUserFiles(userId)` - Get lecturer's files
- `firestoreService.js` → `getAllFiles()` - Get all files (Exam Unit)
- `firestoreService.js` → `getFileMetadata(fileId)` - Get file info
- `firestoreService.js` → `deleteFileMetadata(fileId)` - Delete file
- `storageService.js` → `uploadEncryptedFile()` - Upload encrypted file
- `storageService.js` → `downloadEncryptedFile()` - Download encrypted file
- `storageService.js` → `deleteFile()` - Delete from storage

### **Workflow**
- `firestoreService.js` → `submitFileForReview()` - Submit for HOS review
- `firestoreService.js` → `hosApproveFile()` - HOS approval
- `firestoreService.js` → `hosRejectFile()` - HOS request revision
- `firestoreService.js` → `examUnitApproveFile()` - Final approval
- `firestoreService.js` → `examUnitRejectFile()` - Exam Unit request revision

### **User Management** (Exam Unit only)
- `firestoreService.js` → `getAllUsers()` - Get all users
- `firestoreService.js` → `updateUser(userId, updates)` - Edit user
- `firestoreService.js` → `deleteUser(userId)` - Delete user
- `firestoreService.js` → `updateUserRole()` - Change user role

### **Department Management** (Exam Unit only)
- `firestoreService.js` → `createDepartment()` - Create department
- `firestoreService.js` → `updateDepartment()` - Edit department
- `firestoreService.js` → `deleteDepartment()` - Delete department
- `firestoreService.js` → `assignLecturerToSubject()` - Assign lecturer

---

## ❓ Common Questions & Answers

### **Q: "How does encryption work?"**
**Answer**: 
- Open `src/services/encryptionService.js`
- Show `generateAESKey()` (line 7) - Generates 256-bit key
- Show `encryptFile()` (line 32) - Encrypts before upload
- Show `decryptFile()` (line 76) - Decrypts after download
- **Key Point**: Encryption happens in browser, server never sees plaintext

### **Q: "Where is the file upload logic?"**
**Answer**:
- Main upload: `src/pages/Upload.jsx` → `handleUpload()` (line ~90)
- Encryption: `src/services/encryptionService.js` → `encryptFile()`
- Storage: `src/services/storageService.js` → `uploadEncryptedFile()`
- Metadata: `src/services/firestoreService.js` → `saveFileMetadata()`

### **Q: "How does the approval workflow work?"**
**Answer**:
- Status tracked in `files` collection → `workflowStatus` field
- Submit: `firestoreService.js` → `submitFileForReview()` (line 1087)
- HOS Approve: `firestoreService.js` → `hosApproveFile()` (line 1125)
- Exam Unit Approve: `firestoreService.js` → `examUnitApproveFile()` (line 1216)
- Show workflow in `src/utils/constants.js` or `Dashboard.jsx` (line 46)

### **Q: "Where are security rules?"**
**Answer**:
- `firestore.rules` - Firestore security rules
- Defines who can read/write/delete based on roles
- Department isolation enforced here

### **Q: "How are notifications sent?"**
**Answer**:
- Service: `src/services/notificationService.js`
- Functions: `createNotification()`, `notifyLecturerAboutApproval()`, etc.
- Component: `src/components/NotificationsPanel.jsx`
- Stored in `notifications` collection in Firestore

### **Q: "Where is version control implemented?"**
**Answer**:
- Component: `src/components/VersionHistoryModal.jsx`
- Service: `firestoreService.js` → `getFileVersions()`, `createFileVersion()`
- Each version stored separately in Storage
- Metadata in `fileVersions` collection

### **Q: "How does download history work?"**
**Answer**:
- Component: `src/components/FileCard.jsx` → `handleShowHistory()`
- Service: `firestoreService.js` → `recordDownload()` (line 129)
- Data stored in `files/{fileId}/downloadHistory` array

### **Q: "Where is the dashboard logic?"**
**Answer**:
- `src/pages/Dashboard.jsx`
- Role-specific views:
  - Lecturer: Shows their files
  - HOS: Shows department files
  - Exam Unit: Shows all files grouped by department
- Uses `getUserFiles()`, `getHOSReviewFiles()`, `getAllFiles()`

### **Q: "How is department isolation enforced?"**
**Answer**:
- Security rules: `firestore.rules`
- HOS queries: `firestoreService.js` → `getHOSReviewFiles(departmentId)`
- Lecturer queries: `firestoreService.js` → `getLecturerAssignedSubjects()`
- Only Exam Unit sees all files

### **Q: "Where is the admin panel?"**
**Answer**:
- Page: `src/pages/AdminPanel.jsx`
- Functions:
  - User management: `updateUser()`, `deleteUser()`
  - Department management: `createDepartment()`, `updateDepartment()`, `deleteDepartment()`
  - Subject management: `updateSubject()`, `deleteSubject()`

---

## 🎯 Quick Navigation Tips

### **If asked about encryption:**
→ Go to `src/services/encryptionService.js`

### **If asked about file upload:**
→ Go to `src/pages/Upload.jsx` → `handleUpload()`

### **If asked about approval workflow:**
→ Go to `src/services/firestoreService.js` → Search for `submitFileForReview`, `hosApproveFile`, `examUnitApproveFile`

### **If asked about security:**
→ Go to `firestore.rules`

### **If asked about UI components:**
→ Go to `src/components/` or `src/pages/`

### **If asked about database structure:**
→ Go to `src/services/firestoreService.js` - All database operations are here

---

## 💡 Presentation Tips

1. **Start with the workflow**: Show how Lecturer → HOS → Exam Unit works
2. **Highlight encryption**: This is a key feature - show `encryptionService.js`
3. **Show security**: Mention `firestore.rules` for access control
4. **Demonstrate features**: Version control, download history, notifications
5. **Be ready to navigate**: Use this guide to quickly find code locations

---

## 🔗 Related Files

- **Firebase Config**: `src/firebase.js`
- **Routing**: `src/App.jsx`
- **Constants**: `src/utils/constants.js`
- **Helpers**: `src/utils/helpers.js`
- **Firebase Config File**: `firebase.json`
- **Security Rules**: `firestore.rules`

---

**Good luck with your presentation! 🚀**

