import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * User Roles
 */
export const USER_ROLES = {
  PENDING: 'pending',
  LECTURER: 'lecturer',
  HOS: 'hos',
  EXAM_UNIT: 'exam_unit'
};

/**
 * Get user role and profile
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Create or update user profile
 */
export const createUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...profileData,
      role: profileData.role || USER_ROLES.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Update user role (Exam Unit only)
 */
export const updateUserRole = async (userId, newRole, additionalData = {}) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole,
      ...additionalData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Get all pending users (Exam Unit only)
 */
export const getPendingUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', USER_ROLES.PENDING));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting pending users:', error);
    throw error;
  }
};

/**
 * Get all users by role
 */
export const getUsersByRole = async (role) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};

/**
 * Get all users
 */
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

/**
 * Check if user has specific role
 */
export const hasRole = (userProfile, role) => {
  return userProfile?.role === role;
};

/**
 * Check if user is Exam Unit
 */
export const isExamUnit = (userProfile) => {
  return hasRole(userProfile, USER_ROLES.EXAM_UNIT);
};

/**
 * Check if user is HOS
 */
export const isHOS = (userProfile) => {
  return hasRole(userProfile, USER_ROLES.HOS);
};

/**
 * Check if user is Lecturer
 */
export const isLecturer = (userProfile) => {
  return hasRole(userProfile, USER_ROLES.LECTURER);
};

/**
 * Check if user is pending approval
 */
export const isPending = (userProfile) => {
  return hasRole(userProfile, USER_ROLES.PENDING);
};

