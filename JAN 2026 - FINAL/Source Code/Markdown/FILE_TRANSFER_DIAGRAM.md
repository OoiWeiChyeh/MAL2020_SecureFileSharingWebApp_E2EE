# 📁 File Transfer Diagram — KUNCHEE Exam Paper Management System

> Complete file lifecycle from upload to download, including encryption, approval workflow, and integrity verification.
>
> *Generated: 2026-03-02*

---

## 1. End-to-End File Transfer Overview

```mermaid
flowchart TD
    subgraph UPLOAD["📤 Upload Phase (Lecturer)"]
        U1["Select File + Subject + Category"]
        U2["Generate AES-256 Key\n(Web Crypto API)"]
        U3["Hash Original File\n(SHA-256)"]
        U4["Encrypt File\n(AES-256-GCM + IV)"]
        U5["Upload .enc Blob\nto Firebase Storage"]
        U6["Save Metadata to Firestore\n(key, hash, URL, status=DRAFT)"]
        U7["Create Version Record"]
        U8["Log Audit Event\n(FILE_UPLOAD)"]
    end

    U1 --> U2 --> U3 --> U4 --> U5 --> U6 --> U7 --> U8

    subgraph WORKFLOW["🔄 Approval Workflow"]
        W1["Lecturer Submits\nfor Review"]
        W2["Status: PENDING_HOS_REVIEW"]
        W3{"HOS Review"}
        W4["Status: PENDING_EXAM_UNIT"]
        W5{"Exam Unit Review"}
        W6["Status: APPROVED\n(Ready for Printing)"]
        W7["Status: NEEDS_REVISION"]
    end

    U8 --> W1 --> W2 --> W3
    W3 -- "✅ Approve" --> W4 --> W5
    W3 -- "❌ Reject" --> W7
    W5 -- "✅ Approve" --> W6
    W5 -- "❌ Reject" --> W7
    W7 -- "Lecturer Revises\n& Resubmits" --> W2

    subgraph DOWNLOAD["📥 Download Phase (Authorized User)"]
        D1["Fetch File Metadata\nfrom Firestore"]
        D2["Retrieve Encryption Key\nfrom Firestore"]
        D3["Download .enc Blob\nfrom Firebase Storage"]
        D4["Decrypt File\n(AES-256-GCM)"]
        D5["Verify Integrity\n(SHA-256 Hash Comparison)"]
        D6["Save Decrypted File\nto User Device"]
        D7["Increment Download Count\n+ Record History"]
        D8["Log Audit Event\n(FILE_DOWNLOAD)"]
    end

    W6 --> D1 --> D2 --> D3 --> D4 --> D5 --> D6 --> D7 --> D8

    style UPLOAD fill:#1a365d,color:#fff,stroke:#2b6cb0
    style WORKFLOW fill:#2d3748,color:#fff,stroke:#4a5568
    style DOWNLOAD fill:#1a4731,color:#fff,stroke:#276749
    style W6 fill:#38a169,color:#fff
    style W7 fill:#e53e3e,color:#fff
```

---

## 2. Detailed Upload Flow

```mermaid
sequenceDiagram
    actor L as Lecturer
    participant B as Browser (React)
    participant WC as Web Crypto API
    participant FS as Firebase Storage
    participant FD as Cloud Firestore
    participant AL as Audit Log

    L->>B: Select file, subject, category
    B->>WC: generateAESKey()
    WC-->>B: AES-256 key (base64)

    B->>WC: generateHash(file)
    WC-->>B: SHA-256 hash (base64)

    B->>WC: encryptFile(file, key)
    WC-->>B: Encrypted data (IV prepended)

    B->>FS: uploadBytes(users/{uid}/{fileId}/{name}.enc)
    FS-->>B: Download URL

    B->>FD: addDoc("files", metadata)
    Note over FD: Stores: fileId, fileName, fileSize,<br/>encryptionKey, downloadURL,<br/>fileHash, category, workflowStatus=DRAFT,<br/>subjectId, departmentId, ownerId

    B->>FD: createFileVersion(version: 1)
    B->>AL: logAuditEvent(FILE_UPLOAD)
    B-->>L: ✅ Upload Success → Dashboard
```

---

## 3. Approval Workflow Detail

```mermaid
sequenceDiagram
    actor L as Lecturer
    actor HOS as Head of School
    actor EU as Exam Unit
    participant FD as Cloud Firestore
    participant NS as Notification Service

    L->>FD: submitFileForReview(fileId)
    FD->>FD: workflowStatus = PENDING_HOS_REVIEW
    FD->>NS: Notify HOS ("New Review Request")

    rect rgb(40, 80, 120)
        Note over HOS,FD: HOS Review Phase
        HOS->>FD: Read file metadata + encrypted blob
        alt Approve
            HOS->>FD: hosApproveFile()
            FD->>FD: workflowStatus = PENDING_EXAM_UNIT
            FD->>NS: Notify Lecturer ("HOS Approved")
        else Reject
            HOS->>FD: hosRejectFile(reason)
            FD->>FD: workflowStatus = NEEDS_REVISION
            FD->>NS: Notify Lecturer ("Revision Needed")
            L->>FD: Upload new version & resubmit
        end
    end

    rect rgb(40, 100, 60)
        Note over EU,FD: Exam Unit Review Phase
        EU->>FD: Read file metadata + encrypted blob
        alt Approve
            EU->>FD: examUnitApproveFile()
            FD->>FD: workflowStatus = APPROVED
            FD->>NS: Notify Lecturer ("File Approved!")
            FD->>NS: Notify HOS ("File Approved by Exam Unit")
        else Reject
            EU->>FD: examUnitRejectFile(reason)
            FD->>FD: workflowStatus = NEEDS_REVISION
            FD->>NS: Notify Lecturer ("Revision Needed")
            L->>FD: Upload new version & resubmit
        end
    end
```

---

## 4. Detailed Download Flow

```mermaid
sequenceDiagram
    actor U as Authorized User
    participant B as Browser (React)
    participant FD as Cloud Firestore
    participant FS as Firebase Storage
    participant WC as Web Crypto API
    participant AL as Audit Log

    U->>B: Open ViewFile page (fileId)
    B->>FD: getFileMetadata(fileId)
    FD-->>B: File metadata (URL, key, hash, fileName)

    U->>B: Click "Download"
    B->>FS: fetch(downloadURL + alt=media)
    FS-->>B: Encrypted .enc blob (Uint8Array)

    B->>WC: decryptFile(encryptedData, key)
    Note over WC: Extract IV (first 12 bytes)<br/>Decrypt with AES-256-GCM
    WC-->>B: Decrypted Blob

    rect rgb(60, 80, 40)
        Note over B,WC: Integrity Verification
        B->>WC: generateHash(decryptedData)
        WC-->>B: Download SHA-256 hash
        B->>B: Compare download hash<br/>vs stored fileHash
        alt Match ✅
            B-->>U: "File integrity verified"
        else Mismatch ⚠️
            B-->>U: "Integrity check FAILED"
        end
    end

    B->>B: downloadBlob(file, fileName)
    B-->>U: 💾 File saved to device

    B->>FD: incrementDownloads(fileId)
    B->>FD: recordDownload(fileId, email)
    B->>AL: logAuditEvent(FILE_DOWNLOAD)
```

---

## 5. Encryption & Key Management Flow

```mermaid
flowchart LR
    subgraph KEYGEN["🔑 Key Generation"]
        K1["crypto.subtle.generateKey()\nAES-GCM, 256-bit"]
        K2["Export as base64 string"]
    end

    subgraph ENCRYPT["🔒 Encryption"]
        E1["Generate random IV\n(12 bytes)"]
        E2["AES-GCM encrypt\n(file → ciphertext + auth tag)"]
        E3["Prepend IV to ciphertext"]
        E4["Output: Uint8Array\n(IV + encrypted data)"]
    end

    subgraph STORE["💾 Storage"]
        S1["Firebase Storage\nusers/{uid}/{fileId}/{name}.enc"]
        S2["Firestore files collection\nencryptionKey, fileHash, downloadURL"]
    end

    subgraph DECRYPT["🔓 Decryption"]
        DE1["Extract IV\n(first 12 bytes)"]
        DE2["Extract ciphertext\n(remaining bytes)"]
        DE3["AES-GCM decrypt\n(validates auth tag)"]
        DE4["Output: Original file\n(as Blob)"]
    end

    K1 --> K2 --> E1 --> E2 --> E3 --> E4
    E4 --> S1
    K2 --> S2
    S1 --> DE1 --> DE2 --> DE3 --> DE4
    S2 -.->|"Key retrieval"| DE3

    style KEYGEN fill:#553c9a,color:#fff
    style ENCRYPT fill:#1a365d,color:#fff
    style STORE fill:#744210,color:#fff
    style DECRYPT fill:#1a4731,color:#fff
```

---

## 6. Workflow Status State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT : File Uploaded

    DRAFT --> PENDING_HOS_REVIEW : Lecturer Submits

    PENDING_HOS_REVIEW --> PENDING_EXAM_UNIT : HOS Approves
    PENDING_HOS_REVIEW --> NEEDS_REVISION : HOS Rejects

    PENDING_EXAM_UNIT --> APPROVED : Exam Unit Approves
    PENDING_EXAM_UNIT --> NEEDS_REVISION : Exam Unit Rejects

    NEEDS_REVISION --> PENDING_HOS_REVIEW : Lecturer Revises & Resubmits

    APPROVED --> [*] : Ready for Download/Printing
```

---

## 7. Data Flow Between Components

| Step | Source | Data | Destination | Protocol |
|------|--------|------|-------------|----------|
| 1 | User browser | Raw file (PDF/DOCX) | Web Crypto API | In-memory |
| 2 | Web Crypto API | AES-256 key | Firestore `files.encryptionKey` | HTTPS (TLS) |
| 3 | Web Crypto API | SHA-256 hash | Firestore `files.fileHash` | HTTPS (TLS) |
| 4 | Web Crypto API | Encrypted blob (IV + ciphertext) | Firebase Storage (`*.enc`) | HTTPS (TLS) |
| 5 | Firebase Storage | Download URL | Firestore `files.downloadURL` | HTTPS (TLS) |
| 6 | Firestore | File metadata | Reviewer browser (HOS/Exam Unit) | HTTPS (TLS) |
| 7 | Firebase Storage | Encrypted blob | Downloader browser | HTTPS (TLS) |
| 8 | Firestore | Encryption key | Web Crypto API (client) | HTTPS (TLS) |
| 9 | Web Crypto API | Decrypted file | User device (save dialog) | Local |

---

## 8. Security Controls at Each Transfer Point

```mermaid
flowchart TD
    subgraph Controls["🛡️ Security Controls"]
        C1["🔐 Firebase Auth\nEmail/Password + Google OAuth"]
        C2["📜 Firestore Rules\nRole-based access (RBAC)"]
        C3["🗄️ Storage Rules\nAuthenticated uploads only"]
        C4["🔒 AES-256-GCM\nClient-side encryption"]
        C5["🔑 PBKDF2 Key Derivation\n100K iterations, SHA-256"]
        C6["#️⃣ SHA-256 Hashing\nFile integrity verification"]
        C7["📋 Audit Logs\nImmutable event recording"]
        C8["🔗 HTTPS/TLS\nData in transit encryption"]
    end

    C1 --> |"Who can access"| C2
    C2 --> |"What they can do"| C3
    C4 --> |"File confidentiality"| C5
    C4 --> |"Tamper detection"| C6
    C6 --> |"Accountability"| C7
    C8 --> |"All transfers"| C1

    style Controls fill:#1a202c,color:#fff,stroke:#4a5568
```

---

*This diagram reflects the current implementation as of 2026-03-02. Update when the system architecture changes.*
