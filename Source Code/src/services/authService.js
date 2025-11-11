import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

/**
 * Register a new user with email and password
 */
export const registerUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    await updateProfile(user, { displayName });
    
    // Create user document in Firestore with 'pending' role
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      role: 'pending', // New users start as pending
      createdAt: new Date(),
      photoURL: user.photoURL || null
    });
    
    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw handleAuthError(error);
  }
};

/**
 * Sign in user with email and password
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw handleAuthError(error);
  }
};

/**
 * Sign in with Google
 */
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user document exists, create if not
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'pending', // New users start as pending
        createdAt: new Date(),
        photoURL: user.photoURL
      });
    }
    
    return user;
  } catch (error) {
    console.error('Error logging in with Google:', error);
    throw handleAuthError(error);
  }
};

/**
 * Sign out current user
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw new Error('Failed to log out');
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw handleAuthError(error);
  }
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Handle authentication errors
 */
const handleAuthError = (error) => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return new Error('Email already in use');
    case 'auth/invalid-email':
      return new Error('Invalid email address');
    case 'auth/operation-not-allowed':
      return new Error('Operation not allowed');
    case 'auth/weak-password':
      return new Error('Password is too weak');
    case 'auth/user-disabled':
      return new Error('User account has been disabled');
    case 'auth/user-not-found':
      return new Error('User not found');
    case 'auth/wrong-password':
      return new Error('Incorrect password');
    case 'auth/invalid-credential':
      return new Error('Invalid credentials');
    case 'auth/popup-closed-by-user':
      return new Error('Popup closed by user');
    case 'auth/network-request-failed':
      return new Error('Network error - please check your connection');
    default:
      return new Error(error.message || 'Authentication failed');
  }
};
