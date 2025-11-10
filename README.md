# Secure Note Sharing App (Web, E2EE)

An Web-based application for **secure note creation and sharing** using **End-to-End Encryption (E2EE)**. This project is developed as part of the *Computing Group Project (MAL2020)* to explore how strong cryptography can be combined with usability for real-world adoption.

## 🔐 Features

* **End-to-End Encryption (E2EE)** for all notes (AES-GCM with Android Keystore).
* **Secure local storage** with SQLCipher for encrypted persistence.
* **Biometric authentication** (fingerprint/face) to unlock the app.
* **Multi-level authentication** – verify identity again before sharing notes.
* **QR-code & NFC-based sharing** for offline, secure note transfer.
* **Two-Factor Authentication (2FA)** for enhanced access control.
* **Optional self-destructing notes** (time-limited or single-view).

## 🎯 Project Scope

This project demonstrates a balance between **cryptographic strength** and **user-friendly design**. It focuses on protecting sensitive personal or professional information such as passwords, academic notes, research findings, or confidential documents.

## 📦 Tech Stack

* **Frontend / App Development**: HTML5, CSS3, JavaScript (React or Vanilla JS)
* **Backend**: Node.js with Express.js
* **Database**: MongoDB with client-side encryption (encrypted local storage)
* **Authentication**: Android Biometric API, Firebase Auth (optional)
* **Secure Key Management**: Android Keystore
* **Authentication**: JWT + Optional 2FA
* **Sharing Mechanisms**: QR Code generator/scanner, NFC data exchange

## 📋 Deliverables

* Web-based Prototype(Optional)
* System documentation (architecture, data flow diagrams, use cases)
* Usability, performance, and security testing results
* Final project report and presentation

## 🚀 Expected Outcomes

* A **working proof-of-concept** app for secure note sharing.
* Contribution to cybersecurity by applying E2EE to personal note management.
* Usability testing showing that security can be **accessible to non-technical users**.
* Potential foundation for further research or commercial privacy tools.

## 👥 Team

This project is developed by the **MAL2020 Computing Group Project team**:

* Shidan
* Farah
* Danial
* Wayden

## 📄 License

This project is for **academic purposes only**. All rights reserved by the MAL2020 project team.