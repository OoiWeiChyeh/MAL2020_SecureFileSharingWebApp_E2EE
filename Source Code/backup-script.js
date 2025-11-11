// Firebase Data Backup Script
// Run with: node backup-script.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
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
const storage = getStorage(app);

async function backupData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `./backups/backup-${timestamp}`;
  
  // Create backup directory
  fs.mkdirSync(backupDir, { recursive: true });
  
  console.log('🔄 Starting Firebase backup...');
  
  try {
    // 1. Backup Firestore data
    console.log('📊 Backing up Firestore...');
    const filesSnapshot = await getDocs(collection(db, 'files'));
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    const filesData = [];
    const usersData = [];
    
    filesSnapshot.forEach(doc => {
      filesData.push({ id: doc.id, ...doc.data() });
    });
    
    usersSnapshot.forEach(doc => {
      usersData.push({ id: doc.id, ...doc.data() });
    });
    
    fs.writeFileSync(
      path.join(backupDir, 'firestore-files.json'), 
      JSON.stringify(filesData, null, 2)
    );
    
    fs.writeFileSync(
      path.join(backupDir, 'firestore-users.json'), 
      JSON.stringify(usersData, null, 2)
    );
    
    // 2. Backup file metadata (without actual files)
    const fileMetadata = filesData.map(file => ({
      id: file.id,
      fileName: file.fileName,
      fileSize: file.fileSize,
      fileType: file.fileType,
      ownerId: file.ownerId,
      sharedWith: file.sharedWith,
      downloads: file.downloads,
      createdAt: file.createdAt,
      downloadURL: file.downloadURL
    }));
    
    fs.writeFileSync(
      path.join(backupDir, 'file-metadata.json'),
      JSON.stringify(fileMetadata, null, 2)
    );
    
    // 3. Create backup info
    const backupInfo = {
      timestamp: new Date().toISOString(),
      filesCount: filesData.length,
      usersCount: usersData.length,
      totalDownloads: filesData.reduce((sum, file) => sum + (file.downloads || 0), 0)
    };
    
    fs.writeFileSync(
      path.join(backupDir, 'backup-info.json'),
      JSON.stringify(backupInfo, null, 2)
    );
    
    console.log('✅ Backup completed!');
    console.log(`📁 Backup saved to: ${backupDir}`);
    console.log(`📊 Files: ${filesData.length}, Users: ${usersData.length}`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
  }
}

backupData();
