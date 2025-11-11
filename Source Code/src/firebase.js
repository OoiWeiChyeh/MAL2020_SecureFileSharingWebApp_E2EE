import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "",
  authDomain: "file-share-f8260.firebaseapp.com",
  projectId: "file-share-f8260",
  storageBucket: "file-share-f8260.firebasestorage.app",
  messagingSenderId: "507853509059",
  appId: "1:507853509059:web:17981215ff209ef15bed76",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
