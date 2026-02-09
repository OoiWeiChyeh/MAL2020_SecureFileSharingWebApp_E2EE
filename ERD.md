# Entity Relationship Diagram (ERD)
## Secure Note App with E2EE - Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FIREBASE FIRESTORE SCHEMA                             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│        USERS             │
├──────────────────────────┤
│ PK: uid (string)         │
├──────────────────────────┤
│ email (string)           │
│ displayName (string)     │
│ role (string)*           │ ──┐
│ department (ref)         │   │
│ assignedSubjects (array) │   │
│ createdAt (timestamp)    │   │
│ updatedAt (timestamp)    │   │
└──────────────────────────┘   │
         ▲                      │
         │                      │
         │                      │
         │ 1..* (createdBy)     │
         │                      │
         │ 1..* (hosId)         │
         │                      │
         │ 1..* (user roles)    │
         │                      ▼
┌──────────────────────────┐     ┌──────────────────────────┐
│      DEPARTMENTS         │────→│    FILE VERSIONS         │
├──────────────────────────┤     ├──────────────────────────┤
│ PK: deptId (string)      │     │ PK: versionId (string)   │
├──────────────────────────┤     ├──────────────────────────┤
│ name (string)            │     │ fileId (ref) ◄─┐
│ code (string)            │     │ version (number)         │
│ hosId (ref)              │     │ encryptionKey (string)   │
│ hosName (string)         │     │ downloadURL (string)     │
│ courses (array)          │     │ fileName (string)        │
│ createdAt (timestamp)    │     │ fileSize (number)        │
│ updatedAt (timestamp)    │     │ uploadedBy (ref)         │
└──────────────────────────┘     │ uploadedByName (string)  │
         │                       │ description (string)     │
         │ 1..*                  │ uploadAt (timestamp)     │
         │                       └──────────────────────────┘
         │
         ├─ contains: COURSES (embedded array)
         │   ├── courseId (string)
         │   ├── courseName (string)
         │   ├── courseCode (string)
         │   ├── description (string)
         │   ├── subjects (array)
         │   │   ├── subjectId (string)
         │   │   ├── subjectName (string)
         │   │   ├── subjectCode (string)
         │   │   ├── assignedLecturerId (ref)
         │   │   └── assignedLecturerName (string)
         │   └── createdAt (timestamp)
         │
         └─ assigned to: HOS users
                (1:1 relationship per department)


┌──────────────────────────┐          ┌──────────────────────────┐
│         FILES            │──────────→│      NOTIFICATIONS      │
├──────────────────────────┤ 1..*      ├──────────────────────────┤
│ PK: fileId (string)      │           │ PK: notifId (string)     │
├──────────────────────────┤           ├──────────────────────────┤
│ fileName (string)        │           │ userId (ref)             │
│ fileSize (number)        │           │ type (string)*           │
│ ownerId (ref) ──┐        │           │ title (string)           │
│ createdBy (ref) │        │           │ message (string)         │
│ departmentId (ref)       │           │ fileId (ref) *optional   │
│ version (number)         │           │ actionUrl (string)       │
│ encryptionKey (string)   │           │ read (boolean)           │
│ downloadURL (string)     │           │ createdAt (timestamp)    │
│ downloads (number)       │           │ readAt (timestamp)       │
│ lastDownloaded (timestamp)           │ updatedAt (timestamp)    │
│ downloadHistory (array)  │           └──────────────────────────┘
│ │ - email (string)       │
│ │ - timestamp (ISO)      │
│ expiresAt (timestamp)    │
│ status (string)*         │           ┌──────────────────────────┐
│ workflowStatus (string)* │──────────→│       FEEDBACK           │
│ │ - DRAFT                │ 1..*      ├──────────────────────────┤
│ │ - PENDING_HOS_REVIEW   │           │ PK: feedbackId (string)  │
│ │ - NEEDS_REVISION       │           ├──────────────────────────┤
│ │ - PENDING_EXAM_UNIT    │           │ fileId (ref)             │
│ │ - APPROVED             │           │ reviewerRole (string)*   │
│ submittedForReviewAt     │           │ reviewerId (ref)         │
│ submittedBy (ref)        │           │ reviewerName (string)    │
│ submittedByName (string) │           │ comments (string)        │
│ hosApprovedAt (timestamp)│           │ action (string)*         │
│ hosApprovedBy (ref)      │           │ status (string)*         │
│ hosApprovedByName (string)           │ createdAt (timestamp)    │
│ hosComments (string)     │           │ updatedAt (timestamp)    │
│ hosRejectedAt (timestamp)│           └──────────────────────────┘
│ hosRejectedBy (ref)      │
│ hosRejectedByName (string)
│ hosRejectionReason (string)
│ examUnitApprovedAt       │
│ examUnitApprovedBy (ref) │
│ examUnitApprovedByName   │
│ examUnitComments (string)│
│ examUnitRejectedAt       │
│ examUnitRejectedBy (ref) │
│ examUnitRejectedByName   │
│ examUnitRejectionReason  │
│ versionDescription (string)
│ sharedWith (array)       │
│ createdAt (timestamp)    │
│ updatedAt (timestamp)    │
└──────────────────────────┘


* Enum Values:
  ─────────────────────
  USER ROLES:
  - exam_unit
  - hos
  - lecturer
  - pending

  FILE STATUS:
  - ready
  - archived

  NOTIFICATION TYPES:
  - review_request
  - approval
  - rejection
  - info

  FEEDBACK ACTION:
  - approved
  - rejected

  FEEDBACK STATUS:
  - pending
  - reviewed
```

## Relationships Summary

| Source | Target | Relationship | Type |
|--------|--------|--------------|------|
| USERS | DEPARTMENTS | HOS assigned to department | 1:1 |
| USERS | FILES | User creates/owns files | 1:* |
| USERS | FILE_VERSIONS | User uploads versions | 1:* |
| USERS | NOTIFICATIONS | User receives notifications | 1:* |
| USERS | FEEDBACK | User provides feedback | 1:* |
| DEPARTMENTS | USERS | Department managed by HOS | 1:* |
| DEPARTMENTS | COURSES | Department contains courses | 1:* |
| COURSES | SUBJECTS | Course contains subjects | 1:* |
| SUBJECTS | USERS | Lecturer assigned to subject | 1:1 |
| FILES | FILE_VERSIONS | File has multiple versions | 1:* |
| FILES | NOTIFICATIONS | File-related notifications | 1:* |
| FILES | FEEDBACK | File receives feedback | 1:* |

## Data Flow

```
1. USER REGISTRATION & AUTHENTICATION
   Registration → User Document Created (role: pending)
                ↓
   Admin Approval → Role Updated (exam_unit/hos/lecturer)

2. FILE UPLOAD & SUBMISSION WORKFLOW
   Lecturer Creates File (createdBy = lecturer UID)
         ↓
   File Status: DRAFT
         ↓
   Lecturer Submits for Review (workflowStatus: PENDING_HOS_REVIEW)
         ↓ Notification sent to HOS
   HOS Reviews File
         ├─ APPROVED → workflowStatus: PENDING_EXAM_UNIT
         │              Notification to Exam Unit
         │
         └─ REJECTED → workflowStatus: NEEDS_REVISION
                       Notification to Lecturer
                       Feedback created
         ↓
   Exam Unit Reviews File
         ├─ APPROVED → workflowStatus: APPROVED ✓
         │              Notifications to all parties
         │
         └─ REJECTED → workflowStatus: NEEDS_REVISION
                       Feedback created

3. FILE VERSION MANAGEMENT
   Upload New Version
         ↓
   Create FILE_VERSION record
         ↓
   Reset workflowStatus to DRAFT
         ↓
   Repeat submission workflow

4. FILE DOWNLOAD & TRACKING
   User Downloads File
         ↓
   Increment downloads counter
         ↓
   Record in downloadHistory array
         ↓
   Create Notification (optional)
```

## Collection Queries

| Operation | Query |
|-----------|-------|
| Get user's files | WHERE createdBy == userId |
| Get pending reviews | WHERE workflowStatus == "PENDING_HOS_REVIEW" AND departmentId == deptId |
| Get exam unit reviews | WHERE workflowStatus == "PENDING_EXAM_UNIT" |
| Get approved files | WHERE workflowStatus == "APPROVED" |
| Get user notifications | WHERE userId == userId AND read == false |
| Get file versions | WHERE fileId == fileId ORDER BY version ASC |
| Get file feedback | WHERE fileId == fileId ORDER BY createdAt DESC |
| Get pending users | WHERE role == "pending" |
| Get department files | WHERE departmentId == deptId |

## Security Rules Summary

| Collection | Owner | HOS | Exam Unit | Anonymous |
|-----------|-------|-----|-----------|-----------|
| users | Read own, update own | Read/update all | - | - |
| departments | - | Read/write | Read | - |
| files | CRUD own | Read/update | Full access | Read (encrypted) |
| fileVersions | Create | - | Full access | Read (encrypted) |
| notifications | Read/update own | - | Full access | - |
| feedback | - | - | CRUD | - |
