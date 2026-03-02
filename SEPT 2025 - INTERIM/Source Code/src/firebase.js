import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDq55jC6xs6WCJOLirsex9S-ddY0hYwQTw",
  authDomain: "file-share-f8260.firebaseapp.com",
  projectId: "file-share-f8260",
  storageBucket: "file-share-f8260.firebasestorage.app",
  messagingSenderId: "507853509059",
  appId: "1:507853509059:web:17981215ff209ef15bed76"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// 🔥 Connect to Firebase Emulator in development
// Only runs when app is accessed via localhost
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🔥 Firebase Emulator Mode Enabled');
  console.log('📍 Auth: http://localhost:9099');
  console.log('📍 Firestore: http://localhost:8080');
  console.log('📍 Storage: http://localhost:9199');
  console.log('📍 Emulator UI: http://localhost:4000');
  
  // Connect to emulators (only once)
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    // Emulators already connected (ignore error on hot reload)
    if (!error.message?.includes('already been called')) {
      console.error('Error connecting to emulators:', error);
    }
  }
}

export default app;
