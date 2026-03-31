import { 
  collection, 
  doc, 
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  FEEDBACK: 'feedback',
  APPROVAL: 'approval',
  REJECTION: 'rejection',
  SUBMISSION: 'submission',
  ROLE_ASSIGNED: 'role_assigned'
};

/**
 * Create a notification
 */
export const createNotification = async (notificationData) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const docRef = await addDoc(notificationsRef, {
      userId: notificationData.userId,
      type: notificationData.type,
      fileId: notificationData.fileId || null,
      fileName: notificationData.fileName || null,
      message: notificationData.message,
      read: false,
      createdAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get notifications for a user
 */
export const getNotificationsForUser = async (userId, limitCount = 50) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        read: true,
        readAt: serverTimestamp()
      })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Helper: Notify lecturer about feedback
 */
export const notifyLecturerAboutFeedback = async (lecturerId, fileId, fileName, reviewerName) => {
  await createNotification({
    userId: lecturerId,
    type: NOTIFICATION_TYPES.FEEDBACK,
    fileId: fileId,
    fileName: fileName,
    message: `${reviewerName} gave feedback on ${fileName}`
  });
};

/**
 * Helper: Notify HOS about submission
 */
export const notifyHOSAboutSubmission = async (hosId, fileId, fileName, lecturerName) => {
  await createNotification({
    userId: hosId,
    type: NOTIFICATION_TYPES.SUBMISSION,
    fileId: fileId,
    fileName: fileName,
    message: `${lecturerName} submitted ${fileName} for review`
  });
};

/**
 * Helper: Notify Exam Unit about HOS approval
 */
export const notifyExamUnitAboutApproval = async (examUnitId, fileId, fileName, hosName) => {
  await createNotification({
    userId: examUnitId,
    type: NOTIFICATION_TYPES.SUBMISSION,
    fileId: fileId,
    fileName: fileName,
    message: `${hosName} approved ${fileName} - awaiting final approval`
  });
};

/**
 * Helper: Notify lecturer about approval
 */
export const notifyLecturerAboutApproval = async (lecturerId, fileId, fileName, approverName, isFinal = false) => {
  await createNotification({
    userId: lecturerId,
    type: NOTIFICATION_TYPES.APPROVAL,
    fileId: fileId,
    fileName: fileName,
    message: isFinal 
      ? `${approverName} gave final approval for ${fileName}`
      : `${approverName} approved ${fileName}`
  });
};

/**
 * Helper: Notify user about role assignment
 */
export const notifyUserAboutRoleAssignment = async (userId, role) => {
  await createNotification({
    userId: userId,
    type: NOTIFICATION_TYPES.ROLE_ASSIGNED,
    message: `Your account has been approved as ${role.replace('_', ' ').toUpperCase()}`
  });
};

