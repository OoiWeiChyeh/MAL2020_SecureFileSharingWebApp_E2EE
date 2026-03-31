# Project Progress Summary

This document summarizes the progress and changes made to the Secure File Share (exam papers) application.

---

## 1. Dashboard & Review Cards (HOS & Exam Unit)

### HOS Dashboard
- **Yellow card "Files to Review"**  
  - Renamed from "Under Review"; this is now the main card that links to the HOS review page.  
  - Shows count of files awaiting HOS review; click opens `/hos-review`.
- **Green "Files to Review" card removed**  
  - The duplicate green action card was removed to avoid confusion.
- **Red "Needs Revision" card added**  
  - Shows count of files that need revision (requested by HOS or Exam Unit).  
  - Click opens HOS review page with the **Needs Revision** tab selected.

### Exam Unit Dashboard
- **"Files to Review" card**  
  - Styled like the HOS card: yellow gradient, same layout, "Click to review" behaviour.  
  - Links to exam unit review page (was previously blue).

### HOS Review Page
- Opening from the dashboard **Needs Revision** card now lands on the **Needs Revision** tab (via `location.state.tab`).

---

## 2. Exam Unit Review Page – Three Tabs

- **Tabs aligned with HOS:**  
  - **Pending Review** – files awaiting exam unit approval.  
  - **Needs Revision** – files with revision requested (by HOS or Exam Unit).  
  - **Approved Files** – fully approved files.
- **Data:** New `getExamUnitAllFiles()` in `firestoreService.js` returns files with statuses `PENDING_EXAM_UNIT`, `NEEDS_REVISION`, and `APPROVED`.
- Stats row updated to include a **Needs Revision** count.

---

## 3. HOS Approved Tab – Files After Exam Unit Approval

- **Issue:** After exam unit approved a file, it disappeared from the HOS view.  
- **Change:** `getHOSAllFiles()` now includes status **`APPROVED`** (in addition to `PENDING_HOS_REVIEW`, `PENDING_EXAM_UNIT`, `NEEDS_REVISION`).  
- **Sort order:** Pending Review → Needs Revision → Approved, then by date (using `examUnitApprovedAt` where relevant).  
- HOS can now see fully approved files in the **Approved Files** tab.

---

## 4. Revision Requested By (HOS vs Exam Unit)

- **Review pages (HOS & Exam Unit):**  
  For files with status **Needs Revision**, the card shows who requested the revision:
  - **Revision requested by: Exam Unit** (red) – when `examUnitRejectedAt` is set; shows name and reason.
  - **Revision requested by: HOS** (orange) – when HOS rejected; shows name and reason.
- **Lecturer (FileCard):**  
  Same “Revision requested by: HOS” or “Exam Unit” block is shown on the lecturer’s file cards (My Files) so they know who requested changes and the reason.

---

## 5. Lecturer File Card – Upload New Version vs Submit for Review

### Files that need revision (NEEDS_REVISION)
- **Main action:** Replaced **Submit for Review** with **Upload New Version** (opens upload-new-version flow).  
- **Button colour:** **Upload New Version** is **green** so it’s distinct from the blue **Download** button.

### Three-dot menu – Upload New Version
- **Shown** only when the file is **Draft** or **Needs Revision**.  
- **Hidden** when the file is **Pending HOS Review**, **Pending Exam Unit**, or **Approved**, so lecturers cannot upload a new version while the file is in review or already approved.

---

## 6. Firestore & Backend

- **`getHOSAllFiles(departmentId)`**  
  - Now fetches statuses: `PENDING_HOS_REVIEW`, `PENDING_EXAM_UNIT`, `NEEDS_REVISION`, **`APPROVED`**.  
  - Sort: by workflow stage, then by date.
- **`getExamUnitAllFiles()`**  
  - New function; returns files with `PENDING_EXAM_UNIT`, `NEEDS_REVISION`, and `APPROVED` for the three-tab Exam Unit review page.

---

## 7. Emulator / Port 8080

- When the Firestore emulator failed (port 8080 in use), the process using the port was identified and terminated.  
- Instructions were added for the user to free the port in the future (e.g. `netstat -ano | findstr :8080`, then `taskkill /PID <pid> /F`).

---

## Files Touched (Summary)

| Area              | Files |
|-------------------|--------|
| Dashboard         | `src/pages/Dashboard.jsx` |
| HOS Review        | `src/pages/HOSReview.jsx` |
| Exam Unit Review  | `src/pages/ExamUnitReview.jsx` |
| Firestore         | `src/services/firestoreService.js` |
| File card (lecturer) | `src/components/FileCard.jsx` |
| Review file card  | `src/components/ReviewFileCard.jsx` |

---

## Quick Reference

- **HOS:** Yellow = Files to Review (click → review); Red = Needs Revision (click → review, revision tab); Green = Approved (info only).  
- **Exam Unit:** Yellow = Files to Review (same style as HOS); review page has Pending / Needs Revision / Approved tabs.  
- **Lecturer:** Needs Revision files show “Revision requested by: HOS/Exam Unit” and a green **Upload New Version** button; Upload New Version in the menu is only for Draft and Needs Revision.
