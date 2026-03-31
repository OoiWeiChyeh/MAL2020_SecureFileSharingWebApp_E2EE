import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDq55jC6xs6WCJOLirsex9S-ddY0hYwQTw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "file-share-f8260.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "file-share-f8260",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "file-share-f8260.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "507853509059",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:507853509059:web:17981215ff209ef15bed76"
};

// Warn if environment variables are not set in production
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !import.meta.env.VITE_FIREBASE_API_KEY) {
  console.warn('⚠️ Firebase config is using hardcoded fallback values. Set VITE_FIREBASE_* environment variables for production.');
}


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
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
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    // Emulators already connected (ignore error on hot reload)
    if (!error.message?.includes('already been called')) {
      console.error('Error connecting to emulators:', error);
    }
  }
}

export default app;
