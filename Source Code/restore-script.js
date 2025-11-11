// Firebase Data Restore Script
// Run with: node restore-script.js backup-folder-name

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  apiKey: "AIzaSyDq55jC6xs6WCJOLirsex9S-ddY0hYwQTw",
  authDomain: "file-share-f8260.firebaseapp.com",
  projectId: "file-share-f8260",
  storageBucket: "file-share-f8260.firebasestorage.app",
  messagingSenderId: "507853509059",
  appId: "1:507853509059:web:17981215ff209ef15bed76"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function restoreData(backupDir) {
  console.log('🔄 Starting Firebase restore...');
  
  try {
    // 1. Restore Firestore files
    const filesPath = path.join(backupDir, 'firestore-files.json');
    if (fs.existsSync(filesPath)) {
      const filesData = JSON.parse(fs.readFileSync(filesPath, 'utf8'));
      console.log(`📊 Restoring ${filesData.length} files...`);
      
      for (const fileData of filesData) {
        await setDoc(doc(db, 'files', fileData.id), fileData);
      }
    }
    
    // 2. Restore Firestore users
    const usersPath = path.join(backupDir, 'firestore-users.json');
    if (fs.existsSync(usersPath)) {
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      console.log(`👥 Restoring ${usersData.length} users...`);
      
      for (const userData of usersData) {
        await setDoc(doc(db, 'users', userData.id), userData);
      }
    }
    
    console.log('✅ Restore completed!');
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
  }
}

// Get backup directory from command line
const backupDir = process.argv[2];
if (!backupDir) {
  console.error('❌ Please provide backup directory: node restore-script.js backup-folder-name');
  process.exit(1);
}

restoreData(backupDir);
