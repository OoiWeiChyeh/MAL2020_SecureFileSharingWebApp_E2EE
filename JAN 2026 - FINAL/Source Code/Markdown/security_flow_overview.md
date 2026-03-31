# FileShare Security Flow Overview

> For diagram sketching — all layers of the system's security architecture.

---

## 1. Authentication Layer (Firebase Auth)

```mermaid
flowchart TD
    U[User] -->|Email + Password| FA[Firebase Auth]
    U -->|Google OAuth| FA
    FA -->|Success| TC{First-time?}
    TC -->|Yes| CR["Create Firestore doc\n(role = pending)"]
    TC -->|No| FE[Fetch existing role]
    CR --> NE["Notify Exam Unit\n(new registration)"]
    NE --> RL[Role Loaded]
    FE --> RL
    RL -->|pending| PA[Pending Approval Page]
    RL -->|lecturer / hos / exam_unit| DASH[Dashboard]
```

**Methods:**
- Email / Password registration & login
- Google Sign-In (OAuth popup)
- Password reset via email

---

## 2. Role-Based Access Control (RBAC)

### Roles hierarchy (4 levels):

| Role | Description | Can Access |
|------|-------------|------------|
| `pending` | Newly registered, awaiting approval | `/pending` only |
| `lecturer` | Approved teacher | Dashboard, Upload, Settings, View Files |
| `hos` | Head of School | All lecturer pages + HOS Review |
| `exam_unit` | Super admin | Everything + Admin Panel + Exam Review |

### Self-promotion protection:
- Users **cannot** change their own `role` field (Firestore rule blocks it)
- Only `exam_unit` can promote users

---

## 3. Frontend Route Guards (3 layers)

```mermaid
flowchart TD
    REQ[Page Request] --> PUB{Public Route?}
    PUB -->|Yes /login, /register| AUTH_CHECK1{Logged in?}
    AUTH_CHECK1 -->|Yes| REDIR_DASH[Redirect → Dashboard]
    AUTH_CHECK1 -->|No| SHOW_PAGE[Show Login/Register]

    PUB -->|No| PR{ProtectedRoute}
    PR --> AUTH_CHECK2{Logged in?}
    AUTH_CHECK2 -->|No| REDIR_LOGIN[Redirect → Login]
    AUTH_CHECK2 -->|Yes| ROLE_CHECK1{Role = pending?}
    ROLE_CHECK1 -->|Yes| REDIR_PENDING[Redirect → Pending]
    ROLE_CHECK1 -->|No| SHOW_PROT[Show Page]

    PUB -->|Role-restricted| RPR{RoleProtectedRoute}
    RPR --> AUTH_CHECK3{Logged in?}
    AUTH_CHECK3 -->|No| REDIR_LOGIN2[Redirect → Login]
    AUTH_CHECK3 -->|Yes| ROLE_CHECK2{Has allowed role?}
    ROLE_CHECK2 -->|No| REDIR_DASH2[Redirect → Dashboard]
    ROLE_CHECK2 -->|Yes| SHOW_ROLE[Show Page]
```

### Route → Guard mapping:

| Route | Guard | Allowed Roles |
|-------|-------|---------------|
| `/login`, `/register` | `PublicRoute` | Unauthenticated only |
| `/dashboard`, `/upload`, `/settings` | `ProtectedRoute` | Any approved role |
| `/admin` | `RoleProtectedRoute` | `exam_unit` |
| `/hos-review` | `RoleProtectedRoute` | `hos`, `exam_unit` |
| `/exam-review` | `RoleProtectedRoute` | `exam_unit` |
| `/file`, `/view/:fileId` | None (public) | Anyone with link + key |

---

## 4. End-to-End File Encryption (Detailed)

### 4.1 Cryptographic Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| **Algorithm** | AES-GCM | `constants.js` → `ENCRYPTION_ALGORITHM.name` |
| **Key length** | 256-bit | `constants.js` → `ENCRYPTION_ALGORITHM.length` |
| **IV length** | 12 bytes (96-bit) | `constants.js` → `ENCRYPTION_ALGORITHM.ivLength` |
| **Key derivation** | PBKDF2 | `encryptionService.js` → `deriveKeyFromPassword()` |
| **PBKDF2 iterations** | 100,000 | Hardcoded in `deriveKeyFromPassword()` |
| **PBKDF2 hash** | SHA-256 | Hardcoded in `deriveKeyFromPassword()` |
| **Salt** | 16 bytes, random per file | `generateSalt()` → `crypto.getRandomValues(new Uint8Array(16))` |
| **Integrity hash** | SHA-256 | `generateHash()` → `crypto.subtle.digest('SHA-256', data)` |
| **API** | Web Crypto API | `window.crypto.subtle` (requires HTTPS) |

### 4.2 Upload Encryption Flow (Step-by-Step)

```mermaid
flowchart TD
    A["User selects file + enters password"] --> B["generateAESKey()"]
    B --> B1["crypto.subtle.generateKey\n(AES-GCM, 256-bit)"]
    B1 --> B2["Export key → Base64 string"]
    B2 --> C["encryptFile(file, base64Key)"]
    C --> C1["Import key from Base64"]
    C1 --> C2["Generate random IV\n(12 bytes)"]
    C2 --> C3["crypto.subtle.encrypt\n(AES-GCM, IV, file buffer)"]
    C3 --> C4["Prepend IV to ciphertext\n[IV | encrypted data]"]
    C4 --> D["uploadEncryptedFile()"]
    D --> D1["Create Blob as\napplication/octet-stream"]
    D1 --> D2["Upload to Storage:\nusers/UID/fileId/filename.enc"]

    B2 --> E["Protect the AES key"]
    E --> E1["generateSalt()\n(16 random bytes)"]
    E1 --> E2["deriveKeyFromPassword\n(password, salt)\nPBKDF2: 100k iterations + SHA-256"]
    E2 --> E3["encryptTextWithSalt\n(aesKey, password, salt)"]
    E3 --> E4["Store in Firestore:\n- encryptedKey (Base64)\n- salt (Base64)\n- fileHash (SHA-256)"]
```

### 4.3 Download Decryption Flow (Step-by-Step)

```mermaid
flowchart TD
    A["User clicks download\n+ enters password"] --> B["Fetch from Firestore:\nencryptedKey, salt, fileHash"]
    B --> C["downloadEncryptedFile(URL)"]
    C --> C1["fetch() → ArrayBuffer → Uint8Array"]
    C1 --> D["Decrypt the AES key"]
    D --> D1["base64ToSalt(salt)\n→ Uint8Array"]
    D1 --> D2["deriveKeyFromPassword\n(password, salt)\nPBKDF2: 100k iterations"]
    D2 --> D3["decryptTextWithSalt\n(encryptedKey, password, salt)\n→ Base64 AES key"]
    D3 --> E["decryptFile(encryptedData, aesKey)"]
    E --> E1["Extract IV = first 12 bytes"]
    E1 --> E2["Extract ciphertext = remaining bytes"]
    E2 --> E3["crypto.subtle.decrypt\n(AES-GCM, IV, ciphertext)"]
    E3 --> F["Original file as Blob\n→ Download to user"]
```

### 4.4 Data Format on Disk

```
Encrypted file blob structure:
┌──────────────┬─────────────────────────────┐
│  IV (12 B)   │     AES-GCM Ciphertext      │
└──────────────┴─────────────────────────────┘

Firestore file document stores:
├── encryptedKey   (Base64 string — AES key encrypted with PBKDF2-derived key)
├── salt           (Base64 string — 16-byte random salt)
├── fileHash       (Base64 string — SHA-256 of original file)
├── createdBy      (UID of uploader)
└── sharedWith     (array of email addresses)
```

### 4.5 Key Security Properties

- **Zero-knowledge**: The server (Firebase) never sees the plaintext file or the AES key
- **Password-protected keys**: Even if Firestore is breached, keys are encrypted with PBKDF2 (100k iterations)
- **Unique salt per file**: Prevents rainbow table attacks on the key encryption
- **Random IV per encryption**: Prevents pattern detection across encrypted files
- **AES-GCM authentication tag**: Detects any tampering with the ciphertext
- **SHA-256 integrity**: Verifies the decrypted file matches the original

---

## 5. Firestore Security Rules (Detailed)

### 5.1 Helper Functions

```
isAuthenticated()    → request.auth != null
getUserRole()        → reads users/{uid}.role from Firestore
isExamUnit()         → authenticated + role == 'exam_unit'
isHOS()              → authenticated + role == 'hos'
isLecturer()         → authenticated + role == 'lecturer'
isOwner(ownerId)     → authenticated + auth.uid == ownerId
hasSharedAccess(arr) → authenticated + auth.email in sharedWith[]
```

### 5.2 Per-Collection Access Matrix

#### `users/{userId}` — User profiles

```mermaid
flowchart LR
    subgraph "users collection"
        direction TB
        CREATE["CREATE"]
        READ["READ"]
        UPDATE["UPDATE"]
        DELETE["DELETE"]
    end

    CREATE -->|"Own doc only + role must = pending"| SELF["Self (authenticated)"]
    READ -->|"Own profile"| SELF
    READ -->|"All users"| HOS["HOS"]
    READ -->|"All users"| LECT["Lecturer"]
    READ -->|"All users"| EU["Exam Unit"]
    UPDATE -->|"Own profile, CANNOT change role"| SELF
    UPDATE -->|"Any user"| HOS
    UPDATE -->|"Any user"| EU
    DELETE -->|"Any user"| EU
```

| Operation | Self | Lecturer | HOS | Exam Unit |
|-----------|------|----------|-----|-----------|
| **Create** | ✅ (role must = `pending`) | — | — | — |
| **Read own** | ✅ | ✅ | ✅ | ✅ |
| **Read others** | ❌ | ✅ | ✅ | ✅ |
| **Update own** | ✅ (cannot change `role`) | ✅ (cannot change `role`) | ✅ | ✅ |
| **Update others** | ❌ | ❌ | ✅ | ✅ |
| **Delete** | ❌ | ❌ | ❌ | ✅ |

> **Anti-privilege-escalation**: `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])` — blocks users from modifying their own role.

#### `files/{fileId}` — Encrypted file metadata

| Operation | Owner | Shared User | HOS | Exam Unit |
|-----------|-------|-------------|-----|-----------|
| **Create** | ✅ (`createdBy` must = UID) | ❌ | ❌ | ✅ |
| **Read** | ✅ | ✅ (email in `sharedWith[]`) | ✅ | ✅ |
| **Update** | ✅ | ❌ | ✅ (for approval/rejection) | ✅ |
| **Delete** | ✅ | ❌ | ❌ | ✅ |

#### `fileVersions/{versionId}` — Version history

| Operation | Any Authenticated | Exam Unit |
|-----------|-------------------|-----------|
| **Read** | ✅ | ✅ |
| **Create** | ✅ | ✅ |
| **Update / Delete** | ❌ | ✅ |

#### `feedback/{feedbackId}` — Review feedback

| Operation | Lecturer | HOS | Exam Unit |
|-----------|----------|-----|-----------|
| **Read** | ✅ | ✅ | ✅ |
| **Create** | ❌ | ✅ | ✅ |
| **Update / Delete** | ❌ | ❌ | ✅ |

#### `notifications/{notificationId}` — User notifications

| Operation | Own Notification | Others' Notifications | Exam Unit |
|-----------|-----------------|----------------------|-----------|
| **Read** | ✅ | ❌ | ✅ |
| **Create** | ✅ (any authenticated) | ✅ | ✅ |
| **Update** | ✅ (mark as read) | ❌ | ✅ |
| **Delete** | ✅ | ❌ | ✅ |

#### `departments/{deptId}` — Department data

| Operation | Any Authenticated | Exam Unit |
|-----------|-------------------|-----------|
| **Read** | ✅ | ✅ |
| **Write** | ❌ | ✅ |

### 5.3 Overall Rules Diagram

```mermaid
flowchart TD
    REQ["Firestore Request"] --> AUTH{"Authenticated?"}
    AUTH -->|No| DENY["❌ DENIED"]
    AUTH -->|Yes| ROLE{"Get user role\nfrom users collection"}
    ROLE --> CHECK{"Which collection?"}

    CHECK -->|users| U_RULES["Self: read/update own\nHOS: read/update all\nExam Unit: full CRUD\nRole change: BLOCKED"]
    CHECK -->|files| F_RULES["Owner: full CRUD\nShared: read only\nHOS: read + update\nExam Unit: full access"]
    CHECK -->|feedback| FB_RULES["All: read\nHOS + EU: create\nEU only: update/delete"]
    CHECK -->|notifications| N_RULES["Own only: read/update/delete\nEU: full access"]
    CHECK -->|departments| D_RULES["All: read\nEU only: write"]
    CHECK -->|fileVersions| FV_RULES["All: read/create\nEU: full access"]
```

---

## 6. Firebase Storage Rules (Detailed)

### 6.1 Storage Path Structure

```
Firebase Storage
└── users/
    └── {userId}/                    ← Owner's UID (auth.uid must match for write)
        └── {fileId}/               ← Unique file identifier
            └── {filename}.enc      ← Encrypted file blob (AES-GCM)
```

### 6.2 Rules Breakdown

```mermaid
flowchart TD
    REQ["Storage Request"] --> AUTH{"request.auth != null?"}
    AUTH -->|No| DENY["❌ DENIED"]
    AUTH -->|Yes| OP{"Read or Write?"}

    OP -->|Read| ALLOW_READ["✅ ALLOWED\n(any authenticated user)"]

    OP -->|Write| UID_CHECK{"request.auth.uid\n== userId in path?"}
    UID_CHECK -->|No| DENY2["❌ DENIED\n(not file owner)"]
    UID_CHECK -->|Yes| SIZE_CHECK{"request.resource.size\n< 50MB?"}
    SIZE_CHECK -->|No| DENY3["❌ DENIED\n(file too large)"]
    SIZE_CHECK -->|Yes| ALLOW_WRITE["✅ ALLOWED"]
```

### 6.3 Rules Matrix

| Action | Condition | Purpose |
|--------|-----------|---------|
| **Read** | `request.auth != null` | Any logged-in user can download (file is encrypted anyway) |
| **Write** | `request.auth != null` | Must be logged in |
| **Write** | `request.auth.uid == userId` | Can only upload to your own folder |
| **Write** | `request.resource.size < 50MB` | Hard size limit per file |

### 6.4 Why Read Access Is Broad

> [!IMPORTANT]
> Storage read access is granted to **all authenticated users** — this is intentional, not a vulnerability:
>
> 1. **Files are AES-256-GCM encrypted** — the `.enc` blob is meaningless without the decryption key
> 2. **The decryption key is stored encrypted in Firestore** — protected by PBKDF2 + user password
> 3. **Firestore rules restrict file metadata access** — only owner, shared users, HOS, or Exam Unit can read the `files` document containing the encrypted key
> 4. **Defense in depth** — even if someone downloads the `.enc` file, they need: the encrypted AES key (from Firestore) + the user's password + the salt → to derive the PBKDF2 key → to decrypt the AES key → to decrypt the file

---

## 7. Full Security Flow (End-to-End)

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Firebase Auth
    participant Firestore
    participant Storage

    User->>Browser: Login (email/pw or Google)
    Browser->>Firebase Auth: Authenticate
    Firebase Auth-->>Browser: Auth token + UID
    Browser->>Firestore: Get user role
    Firestore-->>Browser: role (pending/lecturer/hos/exam_unit)

    alt Role = pending
        Browser-->>User: Show Pending Approval page
    else Role = approved
        Browser-->>User: Show Dashboard (role-filtered)
    end

    Note over User,Storage: FILE UPLOAD FLOW
    User->>Browser: Select file + enter password
    Browser->>Browser: Generate AES-256 key
    Browser->>Browser: Encrypt file (AES-GCM)
    Browser->>Browser: Encrypt key (PBKDF2 + password)
    Browser->>Storage: Upload encrypted .enc file
    Storage-->>Storage: Rule check: auth + userId match + <50MB
    Browser->>Firestore: Store file metadata + encrypted key

    Note over User,Storage: FILE DOWNLOAD FLOW
    User->>Browser: Click download + enter password
    Browser->>Storage: Download .enc file
    Browser->>Firestore: Get encrypted key + file metadata
    Browser->>Browser: Derive key from password (PBKDF2)
    Browser->>Browser: Decrypt AES key
    Browser->>Browser: Decrypt file (AES-GCM)
    Browser-->>User: Original file
```

---

## Summary Table for Diagram

| Security Layer | Technology | Purpose |
|----------------|------------|---------|
| Authentication | Firebase Auth | Email/Password + Google OAuth |
| Authorization (frontend) | React Route Guards | 3 guard types: Public, Protected, RoleProtected |
| Authorization (backend) | Firestore Rules | Per-collection RBAC with role helper functions |
| Storage access | Storage Rules | Owner-write, auth-read, 50MB size limit |
| Data encryption | Web Crypto API | AES-256-GCM file encryption, PBKDF2 key derivation |
| Key management | Client-side | Encrypted with user password, stored in Firestore |
| Role management | Firestore `users` collection | 4 roles: pending → lecturer → hos → exam_unit |
| Anti-privilege-escalation | Firestore rules | Users cannot modify their own `role` field |
