# 🎓 University Exam Paper Management System

A **secure, web-based exam paper management system** with **End-to-End Encryption (E2EE)** and role-based approval workflow. This project is developed as part of the *Computing Group Project (MAL2020)* to demonstrate how strong cryptography can be combined with practical workflow management for academic institutions.

---

## ⚡ Quick Test (No Setup Required!)

**Want to test the system right away?** Visit the live demo:

🔗 **https://file-share-f8260.web.app/login**

### Test Credentials:

| Email | Password | Role |
|-------|----------|------|
| `examunit@admin.com` | `ExamUnit2025!` | Exam Unit (Admin) |
| `Lecture1@test.com` | `test123456` | Lecturer |
| `Hos1@test.com` | `test123456` | HOS (Head of School) |

**Note:** More test accounts available for local development (see [Quick Start](#-quick-start-local-development) section below)

---

## 🔐 Features

* **End-to-End Encryption (E2EE)** for all exam papers using **AES-256-GCM** encryption (Web Crypto API).
* **Client-Side Encryption** – Files encrypted in browser before upload; server never sees plaintext.
* **Three-Tier Approval Workflow** – Lecturer → HOS → Exam Unit for quality assurance.
* **Complete Version Control** – Track all file versions, download any previous version, maintain full history.
* **Comprehensive Audit Trail** – File timeline showing every action, approval, and comment with timestamps.
* **Role-Based Access Control (RBAC)** – Department isolation, role-specific dashboards, secure permissions.
* **Real-Time Notifications** – Instant alerts for workflow changes, approvals, and revisions.
* **Download History Tracking** – Monitor who downloaded what and when for compliance.
* **Advanced Search & Filtering** – Search across files, departments, subjects, and lecturers.
* **Department Isolation** – HOS only sees their department; complete data segregation.

## 🎯 Project Scope

This project demonstrates a balance between **cryptographic strength** and **user-friendly design** for managing sensitive academic documents. It focuses on protecting exam papers throughout their lifecycle while maintaining an efficient approval workflow for university departments.

### **Use Cases:**
* Secure storage and management of exam papers
* Multi-level quality assurance before printing
* Compliance with academic data protection requirements
* Version control for exam paper revisions
* Complete audit trail for accountability

## 📦 Tech Stack

* **Frontend**: React.js + Vite + TailwindCSS
* **Backend**: Firebase (Authentication, Firestore, Cloud Storage)
* **Encryption**: AES-256-GCM (Web Crypto API)
* **Authentication**: Firebase Authentication (Email/Password, Google OAuth)
* **Database**: Cloud Firestore (NoSQL) with security rules
* **File Storage**: Firebase Cloud Storage (encrypted blobs)
* **Development**: Firebase Emulator Suite (local development)
* **Deployment**: Firebase Hosting

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone & Install
git clone <repository-url>
cd "file web"
npm install

# 2. Start Firebase Emulator (Terminal 1)
npm run emulator

# 3. Create Test Users (first time only, Terminal 2)
node seed-simple.js

# 4. Start Development Server (Terminal 2)
npm run dev
```

**Access:**
- **App**: http://localhost:3000
- **Emulator UI**: http://localhost:4000
- **Test Login**: `lecturer1@test.com` / `test123456`

## 🎯 System Roles

### **Three User Roles:**

1. **Exam Unit (Admin)**
   - Manage all users and departments
   - Final approval authority
   - System-wide visibility
   - User role assignment

2. **HOS (Head of School/Department)**
   - Review exam papers from their department
   - Approve or request revisions
   - Department-level oversight

3. **Lecturers**
   - Upload exam papers
   - Submit for review
   - Upload new versions based on feedback
   - View download statistics

### **Workflow:**
```
Lecturer uploads exam paper
         ↓
HOS reviews & approves
         ↓
Exam Unit final approval
         ↓
Ready for printing
```

## 🔒 Security Architecture

### **Encryption:**
- **Algorithm**: AES-256-GCM (Advanced Encryption Standard)
- **Key Size**: 256-bit keys (maximum security)
- **Mode**: GCM (provides confidentiality + authenticity)
- **Key Generation**: Cryptographically secure random (Web Crypto API)
- **IV**: 12-byte random initialization vector per encryption

### **Security Features:**
- ✅ Zero-knowledge architecture (server never sees plaintext)
- ✅ Files encrypted before leaving browser
- ✅ Per-file unique encryption keys
- ✅ Firestore security rules for access control
- ✅ Department-based data isolation
- ✅ Role-based permissions

### **Data Flow:**
1. User selects file → Encrypted in browser (AES-256-GCM)
2. Encrypted blob uploaded to Firebase Storage
3. Metadata (filename, size, encryption key) stored in Firestore
4. Download: Encrypted file → Decrypted in browser → Saved locally

## 📋 Deliverables

* ✅ **Working Web Application** – Fully functional exam paper management system
* ✅ **System Documentation** – Architecture, data flow diagrams, security documentation
* ✅ **Security Analysis** – Encryption implementation, threat model, best practices
* ✅ **User Documentation** – Setup guides, team collaboration workflows
* ✅ **Final Project Report and Presentation**

## 🚀 Expected Outcomes

* A **production-ready** exam paper management system with enterprise-grade security.
* Demonstration that **strong cryptography** can be seamlessly integrated into practical workflows.
* **Usability testing** showing that security features are accessible to non-technical users (lecturers, HOS).
* **Foundation for real-world deployment** in academic institutions.
* Contribution to **cybersecurity education** by applying E2EE to document management.

## 📊 Key Features in Detail

### **1. End-to-End Encryption**
- Files encrypted using AES-256-GCM before upload
- Server never has access to plaintext data
- Each file gets a unique encryption key
- Decryption happens client-side only

### **2. Version Control System**
- Every file update creates a new version (v1, v2, v3...)
- Previous versions are never deleted
- Download any version at any time
- Version descriptions and change tracking

### **3. Approval Workflow**
- Three-tier quality assurance process
- Revision request system with feedback
- Status tracking (Draft → Pending HOS → Pending Exam Unit → Approved)
- Automatic notifications at each stage

### **4. Audit Trail**
- Complete file timeline
- Every action recorded with timestamp
- Who uploaded, approved, downloaded
- Comments and feedback history

### **5. Department Isolation**
- HOS only sees their department's files
- Lecturers only see their assigned subjects
- Exam Unit has system-wide access
- Enforced by Firestore security rules

## 👥 Team

This project is developed by the **MAL2020 Computing Group Project team**:

* Shidan
* Farah
* Danial
* Wayden

## 📄 License

This project is for **academic purposes only**. All rights reserved by the MAL2020 project team.

---

## 📚 Additional Documentation

For detailed information, see:
- **Setup Guide**: [TEAM_SETUP.md](../file%20web/TEAM_SETUP.md)
- **Security Details**: [SECURITY.md](../file%20web/SECURITY.md)
- **Quick Reference**: [QUICK_REFERENCE.md](../file%20web/QUICK_REFERENCE.md)

---

**🔒 Secure. Efficient. Compliant.**