import { 
  collection, 
  doc, 
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Add feedback to a file
 */
export const addFeedback = async (feedbackData) => {
  try {
    const feedbackRef = collection(db, 'feedback');
    const docRef = await addDoc(feedbackRef, {
      fileId: feedbackData.fileId,
      version: feedbackData.version,
      reviewerId: feedbackData.reviewerId,
      reviewerRole: feedbackData.reviewerRole,
      reviewerName: feedbackData.reviewerName,
      feedbackText: feedbackData.feedbackText,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding feedback:', error);
    throw error;
  }
};

/**
 * Get feedback for a file
 */
export const getFeedbackForFile = async (fileId) => {
  try {
    const feedbackRef = collection(db, 'feedback');
    const q = query(
      feedbackRef,
      where('fileId', '==', fileId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting feedback:', error);
    throw error;
  }
};

/**
 * Mark feedback as addressed
 */
export const markFeedbackAsAddressed = async (feedbackId) => {
  try {
    const feedbackRef = doc(db, 'feedback', feedbackId);
    await updateDoc(feedbackRef, {
      status: 'addressed',
      addressedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking feedback as addressed:', error);
    throw error;
  }
};

/**
 * Get pending feedback for user
 */
export const getPendingFeedbackForUser = async (userId) => {
  try {
    // First get all files created by this user
    const filesRef = collection(db, 'files');
    const filesQuery = query(filesRef, where('createdBy', '==', userId));
    const filesSnapshot = await getDocs(filesQuery);
    
    const fileIds = filesSnapshot.docs.map(doc => doc.id);
    
    if (fileIds.length === 0) {
      return [];
    }
    
    // Get feedback for these files
    const feedbackRef = collection(db, 'feedback');
    const feedbackQuery = query(
      feedbackRef,
      where('fileId', 'in', fileIds.slice(0, 10)), // Firestore 'in' limit is 10
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const feedbackSnapshot = await getDocs(feedbackQuery);
    
    return feedbackSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting pending feedback for user:', error);
    throw error;
  }
};

