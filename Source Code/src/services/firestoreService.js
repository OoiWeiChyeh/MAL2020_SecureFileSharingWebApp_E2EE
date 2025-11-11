import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Save file metadata to Firestore
 */
export const saveFileMetadata = async (userId, fileData) => {
  try {
    const filesRef = collection(db, 'files');
    const docRef = await addDoc(filesRef, {
      ...fileData,
      ownerId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      sharedWith: [],
      downloads: 0,
      status: 'ready',
      expiresAt: fileData.expiresAt || null,
      downloadHistory: []
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving file metadata:', error);
    throw new Error('Failed to save file metadata');
  }
};

/**
 * Get file metadata by ID
 */
export const getFileMetadata = async (fileId) => {
  try {
    const docRef = doc(db, 'files', fileId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('File not found');
    }
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw new Error('Failed to get file metadata');
  }
};

/**
 * Get all files owned by user
 */
export const getUserFiles = async (userId) => {
  try {
    const filesRef = collection(db, 'files');
    const q = query(
      filesRef, 
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const files = [];
    
    querySnapshot.forEach((doc) => {
      files.push({ id: doc.id, ...doc.data() });
    });
    
    return files;
  } catch (error) {
    console.error('Error getting user files:', error);
    throw new Error('Failed to get user files');
  }
};

/**
 * Get files shared with user
 */
export const getSharedFiles = async (userEmail) => {
  try {
    const filesRef = collection(db, 'files');
    const q = query(
      filesRef,
      where('sharedWith', 'array-contains', userEmail),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const files = [];
    
    querySnapshot.forEach((doc) => {
      files.push({ id: doc.id, ...doc.data() });
    });
    
    return files;
  } catch (error) {
    console.error('Error getting shared files:', error);
    throw new Error('Failed to get shared files');
  }
};

/**
 * Get all files (for Exam Unit - admin view)
 */
export const getAllFiles = async () => {
  try {
    const filesRef = collection(db, 'files');
    const q = query(filesRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const files = [];
    
    querySnapshot.forEach((doc) => {
      files.push({ id: doc.id, ...doc.data() });
    });
    
    return files;
  } catch (error) {
    console.error('Error getting all files:', error);
    throw new Error('Failed to get all files');
  }
};

/**
 * Update file metadata
 */
export const updateFileMetadata = async (fileId, updates) => {
  try {
    const docRef = doc(db, 'files', fileId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating file metadata:', error);
    throw new Error('Failed to update file metadata');
  }
};

/**
 * Share file with user(s)
 */
export const shareFile = async (fileId, userEmails) => {
  try {
    const docRef = doc(db, 'files', fileId);
    
    // Add emails to sharedWith array
    for (const email of userEmails) {
      await updateDoc(docRef, {
        sharedWith: arrayUnion(email),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error sharing file:', error);
    throw new Error('Failed to share file');
  }
};

/**
 * Revoke file access from a user
 */
export const revokeFileAccess = async (fileId, userEmail) => {
  try {
    const docRef = doc(db, 'files', fileId);
    await updateDoc(docRef, {
      sharedWith: arrayRemove(userEmail),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error revoking file access:', error);
    throw new Error('Failed to revoke file access');
  }
};

/**
 * Record a file download in history
 */
export const recordDownload = async (fileId, userEmail) => {
  try {
    const docRef = doc(db, 'files', fileId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const currentHistory = docSnap.data().downloadHistory || [];
      
      // Add to history
      const newHistory = [...currentHistory, {
        email: userEmail,
        timestamp: new Date().toISOString(),
        downloadedAt: serverTimestamp()
      }];
      
      // Keep only last 100 downloads
      const trimmedHistory = newHistory.slice(-100);
      
      await updateDoc(docRef, {
        downloadHistory: trimmedHistory,
        lastDownloaded: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error recording download:', error);
    // Don't throw - this is non-critical
  }
};

/**
 * Get download history for a file
 */
export const getDownloadHistory = async (fileId) => {
  try {
    const docRef = doc(db, 'files', fileId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().downloadHistory || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting download history:', error);
    throw new Error('Failed to get download history');
  }
};

/**
 * Bulk share files with multiple users
 */
export const bulkShareFiles = async (fileIds, userEmails) => {
  try {
    // Share each file with each email
    for (const fileId of fileIds) {
      await shareFile(fileId, userEmails);
    }
  } catch (error) {
    console.error('Error bulk sharing files:', error);
    throw new Error('Failed to bulk share files');
  }
};

/**
 * Set file expiration date
 */
export const setFileExpiration = async (fileId, expirationDate) => {
  try {
    const docRef = doc(db, 'files', fileId);
    await updateDoc(docRef, {
      expiresAt: expirationDate,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error setting file expiration:', error);
    throw new Error('Failed to set file expiration');
  }
};

/**
 * Check if file is expired
 */
export const isFileExpired = (file) => {
  if (!file.expiresAt) return false;
  
  const expirationTime = file.expiresAt.toMillis?.() || new Date(file.expiresAt).getTime();
  return Date.now() > expirationTime;
};

/**
 * Get days until expiration
 */
export const daysUntilExpiration = (file) => {
  if (!file.expiresAt) return null;
  
  const expirationTime = file.expiresAt.toMillis?.() || new Date(file.expiresAt).getTime();
  const now = Date.now();
  const daysLeft = Math.ceil((expirationTime - now) / (1000 * 60 * 60 * 24));
  
  return daysLeft > 0 ? daysLeft : 0;
};

/**
 * Revoke file access
 */
export const revokeFileAccessByUser = async (fileId, userEmail) => {
  try {
    const docRef = doc(db, 'files', fileId);
    await updateDoc(docRef, {
      sharedWith: arrayRemove(userEmail),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error revoking file access:', error);
    throw new Error('Failed to revoke file access');
  }
};

/**
 * Delete file metadata
 */
export const deleteFileMetadata = async (fileId) => {
  try {
    const docRef = doc(db, 'files', fileId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting file metadata:', error);
    throw new Error('Failed to delete file metadata');
  }
};

/**
 * Increment download count
 */
export const incrementDownloads = async (fileId, userEmail = 'anonymous') => {
  try {
    const docRef = doc(db, 'files', fileId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const currentDownloads = docSnap.data().downloads || 0;
      await updateDoc(docRef, {
        downloads: currentDownloads + 1,
        lastDownloaded: serverTimestamp()
      });
      
      // Also record in history
      await recordDownload(fileId, userEmail);
    }
  } catch (error) {
    console.error('Error incrementing downloads:', error);
    // Don't throw error, just log it
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error('User profile not found');
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to get user profile');
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
};

// ==================== ROLE-BASED SYSTEM ====================

/**
 * User Role Management
 */
export const getUserRole = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data().role || 'pending';
    }
    return 'pending';
  } catch (error) {
    console.error('Error getting user role:', error);
    throw error;
  }
};

export const updateUserRole = async (userId, role, additionalData = {}) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role,
      ...additionalData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const getPendingUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting pending users:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// ==================== DEPARTMENT MANAGEMENT ====================

export const createDepartment = async (departmentData) => {
  try {
    const deptRef = collection(db, 'departments');
    const docRef = await addDoc(deptRef, {
      ...departmentData,
      courses: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
};

export const getDepartments = async () => {
  try {
    const deptRef = collection(db, 'departments');
    const snapshot = await getDocs(deptRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting departments:', error);
    throw error;
  }
};

export const getDepartmentById = async (deptId) => {
  try {
    const deptRef = doc(db, 'departments', deptId);
    const deptSnap = await getDoc(deptRef);
    if (deptSnap.exists()) {
      return { id: deptSnap.id, ...deptSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting department:', error);
    throw error;
  }
};

export const updateDepartment = async (deptId, updates) => {
  try {
    const deptRef = doc(db, 'departments', deptId);
    await updateDoc(deptRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating department:', error);
    throw error;
  }
};

export const deleteDepartment = async (deptId) => {
  try {
    const deptRef = doc(db, 'departments', deptId);
    await deleteDoc(deptRef);
  } catch (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
};

export const assignHOSToDepartment = async (deptId, hosId, hosName) => {
  try {
    const deptRef = doc(db, 'departments', deptId);
    await updateDoc(deptRef, {
      hosId,
      hosName,
      updatedAt: serverTimestamp()
    });
    
    // Update user's department
    const userRef = doc(db, 'users', hosId);
    await updateDoc(userRef, {
      department: deptId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error assigning HOS:', error);
    throw error;
  }
};

// ==================== COURSE MANAGEMENT ====================

export const addCourseToDepartment = async (deptId, courseData) => {
  try {
    const deptRef = doc(db, 'departments', deptId);
    const deptSnap = await getDoc(deptRef);
    
    if (!deptSnap.exists()) {
      throw new Error('Department not found');
    }
    
    const courses = deptSnap.data().courses || [];
    const newCourse = {
      courseId: `course_${Date.now()}`,
      ...courseData,
      subjects: [],
      createdAt: new Date().toISOString()
    };
    
    courses.push(newCourse);
    
    await updateDoc(deptRef, {
      courses,
      updatedAt: serverTimestamp()
    });
    
    return newCourse.courseId;
  } catch (error) {
    console.error('Error adding course:', error);
    throw error;
  }
};

export const updateCourse = async (deptId, courseId, updates) => {
  try {
    const deptRef = doc(db, 'departments', deptId);
    const deptSnap = await getDoc(deptRef);
    
    if (!deptSnap.exists()) {
      throw new Error('Department not found');
    }
    
    const courses = deptSnap.data().courses || [];
    const courseIndex = courses.findIndex(c => c.courseId === courseId);
    
    if (courseIndex === -1) {
      throw new Error('Course not found');
    }
    
    courses[courseIndex] = {
      ...courses[courseIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(deptRef, {
      courses,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

export const deleteCourse = async (deptId, courseId) => {
  try {
    const deptRef = doc(db, 'departments', deptId);
    const deptSnap = await getDoc(deptRef);
    
    if (!deptSnap.exists()) {
      throw new Error('Department not found');
    }
    
    const courses = deptSnap.data().courses.filter(c => c.courseId !== courseId);
    
    await updateDoc(deptRef, {
      courses,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

// ==================== SUBJECT MANAGEMENT ====================

export const addSubjectToCourse = async (deptId, courseId, subjectData) => {
  try {
    const deptRef = doc(db, 'departments', deptId);
    const deptSnap = await getDoc(deptRef);
    
    if (!deptSnap.exists()) {
      throw new Error('Department not found');
    }
    
    const courses = deptSnap.data().courses || [];
    const courseIndex = courses.findIndex(c => c.courseId === courseId);
    
    if (courseIndex === -1) {
      throw new Error('Course not found');
    }
    
    const newSubject = {
      subjectId: `subject_${Date.now()}`,
      ...subjectData,
      assignedLecturerId: null,
      assignedLecturerName: null,
      createdAt: new Date().toISOString()
    };
    
    courses[courseIndex].subjects = courses[courseIndex].subjects || [];
    courses[courseIndex].subjects.push(newSubject);
    
    await updateDoc(deptRef, {
      courses,
      updatedAt: serverTimestamp()
    });
    
    return newSubject.subjectId;
  } catch (error) {
    console.error('Error adding subject:', error);
    throw error;
  }
};

export const assignLecturerToSubject = async (deptId, courseId, subjectId, lecturerId, lecturerName) => {
  try {
    const deptRef = doc(db, 'departments', deptId);
    const deptSnap = await getDoc(deptRef);
    
    if (!deptSnap.exists()) {
      throw new Error('Department not found');
    }
    
    const courses = deptSnap.data().courses || [];
    const courseIndex = courses.findIndex(c => c.courseId === courseId);
    
    if (courseIndex === -1) {
      throw new Error('Course not found');
    }
    
    const subjectIndex = courses[courseIndex].subjects.findIndex(s => s.subjectId === subjectId);
    
    if (subjectIndex === -1) {
      throw new Error('Subject not found');
    }
    
    courses[courseIndex].subjects[subjectIndex].assignedLecturerId = lecturerId;
    courses[courseIndex].subjects[subjectIndex].assignedLecturerName = lecturerName;
    
    await updateDoc(deptRef, {
      courses,
      updatedAt: serverTimestamp()
    });
    
    // Update lecturer's assigned subjects
    const userRef = doc(db, 'users', lecturerId);
    await updateDoc(userRef, {
      assignedSubjects: arrayUnion({
        deptId,
        courseId,
        subjectId,
        subjectCode: courses[courseIndex].subjects[subjectIndex].subjectCode,
        subjectName: courses[courseIndex].subjects[subjectIndex].subjectName
      }),
      department: deptId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error assigning lecturer:', error);
    throw error;
  }
};

export const unassignLecturerFromSubject = async (deptId, courseId, subjectId, lecturerId) => {
  try {
    const deptRef = doc(db, 'departments', deptId);
    const deptSnap = await getDoc(deptRef);
    
    if (!deptSnap.exists()) {
      throw new Error('Department not found');
    }
    
    const courses = deptSnap.data().courses || [];
    const courseIndex = courses.findIndex(c => c.courseId === courseId);
    
    if (courseIndex === -1) {
      throw new Error('Course not found');
    }
    
    const subjectIndex = courses[courseIndex].subjects.findIndex(s => s.subjectId === subjectId);
    
    if (subjectIndex === -1) {
      throw new Error('Subject not found');
    }
    
    const subject = courses[courseIndex].subjects[subjectIndex];
    courses[courseIndex].subjects[subjectIndex].assignedLecturerId = null;
    courses[courseIndex].subjects[subjectIndex].assignedLecturerName = null;
    
    await updateDoc(deptRef, {
      courses,
      updatedAt: serverTimestamp()
    });
    
    // Update lecturer's assigned subjects
    if (lecturerId) {
      const userRef = doc(db, 'users', lecturerId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const assignedSubjects = userSnap.data().assignedSubjects || [];
        const updatedSubjects = assignedSubjects.filter(s => s.subjectId !== subjectId);
        await updateDoc(userRef, {
          assignedSubjects: updatedSubjects,
          updatedAt: serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error unassigning lecturer:', error);
    throw error;
  }
};

export const deleteSubject = async (deptId, courseId, subjectId) => {
  try {
    const deptRef = doc(db, 'departments', deptId);
    const deptSnap = await getDoc(deptRef);
    
    if (!deptSnap.exists()) {
      throw new Error('Department not found');
    }
    
    const courses = deptSnap.data().courses || [];
    const courseIndex = courses.findIndex(c => c.courseId === courseId);
    
    if (courseIndex === -1) {
      throw new Error('Course not found');
    }
    
    courses[courseIndex].subjects = courses[courseIndex].subjects.filter(s => s.subjectId !== subjectId);
    
    await updateDoc(deptRef, {
      courses,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    throw error;
  }
};

export const getLecturerAssignedSubjects = async (lecturerId) => {
  try {
    const userRef = doc(db, 'users', lecturerId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data().assignedSubjects || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting lecturer subjects:', error);
    throw error;
  }
};

// ==================== FILE VERSION MANAGEMENT ====================

export const createFileVersion = async (fileId, versionData) => {
  try {
    const versionRef = collection(db, 'fileVersions');
    const docRef = await addDoc(versionRef, {
      fileId,
      ...versionData,
      uploadedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating file version:', error);
    throw error;
  }
};

export const getFileVersions = async (fileId) => {
  try {
    const versionRef = collection(db, 'fileVersions');
    const q = query(versionRef, where('fileId', '==', fileId), orderBy('version', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting file versions:', error);
    throw error;
  }
};

export const getLatestFileVersion = async (fileId) => {
  try {
    const versionRef = collection(db, 'fileVersions');
    const q = query(versionRef, where('fileId', '==', fileId), orderBy('version', 'desc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting latest version:', error);
    throw error;
  }
};

// ==================== FEEDBACK MANAGEMENT ====================

export const createFeedback = async (feedbackData) => {
  try {
    const feedbackRef = collection(db, 'feedback');
    const docRef = await addDoc(feedbackRef, {
      ...feedbackData,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating feedback:', error);
    throw error;
  }
};

export const getFileFeedback = async (fileId) => {
  try {
    const feedbackRef = collection(db, 'feedback');
    const q = query(feedbackRef, where('fileId', '==', fileId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting file feedback:', error);
    throw error;
  }
};

export const updateFeedbackStatus = async (feedbackId, status) => {
  try {
    const feedbackRef = doc(db, 'feedback', feedbackId);
    await updateDoc(feedbackRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    throw error;
  }
};

// ==================== NOTIFICATION MANAGEMENT ====================

export const createNotification = async (notificationData) => {
  try {
    const notificationRef = collection(db, 'notifications');
    const docRef = await addDoc(notificationRef, {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getUserNotifications = async (userId) => {
  try {
    const notificationRef = collection(db, 'notifications');
    const q = query(notificationRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

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

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationRef = collection(db, 'notifications');
    const q = query(notificationRef, where('userId', '==', userId), where('read', '==', false));
    const snapshot = await getDocs(q);
    
    const updates = snapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        read: true,
        readAt: serverTimestamp()
      })
    );
    
    await Promise.all(updates);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const getUnreadNotificationCount = async (userId) => {
  try {
    const notificationRef = collection(db, 'notifications');
    const q = query(notificationRef, where('userId', '==', userId), where('read', '==', false));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// ==================== WORKFLOW MANAGEMENT ====================

/**
 * Submit file for HOS review
 */
export const submitFileForReview = async (fileId, userId, userName) => {
  try {
    const fileRef = doc(db, 'files', fileId);
    await updateDoc(fileRef, {
      workflowStatus: 'PENDING_HOS_REVIEW',
      submittedForReviewAt: serverTimestamp(),
      submittedBy: userId,
      submittedByName: userName,
      updatedAt: serverTimestamp()
    });

    // Get file data to find HOS
    const fileSnap = await getDoc(fileRef);
    if (fileSnap.exists() && fileSnap.data().departmentId) {
      const deptId = fileSnap.data().departmentId;
      const dept = await getDepartmentById(deptId);
      
      if (dept && dept.hosId) {
        // Create notification for HOS
        await createNotification({
          userId: dept.hosId,
          type: 'review_request',
          title: 'New Review Request',
          message: `${userName} has submitted ${fileSnap.data().fileName} for review`,
          fileId: fileId,
          actionUrl: `/dashboard`
        });
      }
    }
  } catch (error) {
    console.error('Error submitting file for review:', error);
    throw error;
  }
};

/**
 * HOS review actions
 */
export const hosApproveFile = async (fileId, hosId, hosName, comments = '') => {
  try {
    const fileRef = doc(db, 'files', fileId);
    await updateDoc(fileRef, {
      workflowStatus: 'PENDING_EXAM_UNIT',
      hosApprovedAt: serverTimestamp(),
      hosApprovedBy: hosId,
      hosApprovedByName: hosName,
      hosComments: comments,
      updatedAt: serverTimestamp()
    });

    // Get file data for notifications
    const fileSnap = await getDoc(fileRef);
    if (fileSnap.exists()) {
      const fileData = fileSnap.data();
      
      // Notify file owner
      await createNotification({
        userId: fileData.createdBy,
        type: 'approval',
        title: 'HOS Approved',
        message: `Your file "${fileData.fileName}" has been approved by HOS and sent to Exam Unit`,
        fileId: fileId,
        actionUrl: `/dashboard`
      });

      // Create feedback record
      if (comments) {
        await createFeedback({
          fileId,
          reviewerRole: 'hos',
          reviewerId: hosId,
          reviewerName: hosName,
          comments,
          action: 'approved'
        });
      }
    }
  } catch (error) {
    console.error('Error approving file:', error);
    throw error;
  }
};

export const hosRejectFile = async (fileId, hosId, hosName, reason) => {
  try {
    const fileRef = doc(db, 'files', fileId);
    await updateDoc(fileRef, {
      workflowStatus: 'NEEDS_REVISION',
      hosRejectedAt: serverTimestamp(),
      hosRejectedBy: hosId,
      hosRejectedByName: hosName,
      hosRejectionReason: reason,
      updatedAt: serverTimestamp()
    });

    // Get file data for notifications
    const fileSnap = await getDoc(fileRef);
    if (fileSnap.exists()) {
      const fileData = fileSnap.data();
      
      // Notify file owner
      await createNotification({
        userId: fileData.createdBy,
        type: 'rejection',
        title: 'Revision Needed',
        message: `Your file "${fileData.fileName}" needs revision. Reason: ${reason}`,
        fileId: fileId,
        actionUrl: `/dashboard`
      });

      // Create feedback record
      await createFeedback({
        fileId,
        reviewerRole: 'hos',
        reviewerId: hosId,
        reviewerName: hosName,
        comments: reason,
        action: 'rejected'
      });
    }
  } catch (error) {
    console.error('Error rejecting file:', error);
    throw error;
  }
};

/**
 * Exam Unit review actions
 */
export const examUnitApproveFile = async (fileId, examUnitId, examUnitName, comments = '') => {
  try {
    const fileRef = doc(db, 'files', fileId);
    await updateDoc(fileRef, {
      workflowStatus: 'APPROVED',
      examUnitApprovedAt: serverTimestamp(),
      examUnitApprovedBy: examUnitId,
      examUnitApprovedByName: examUnitName,
      examUnitComments: comments,
      updatedAt: serverTimestamp()
    });

    // Get file data for notifications
    const fileSnap = await getDoc(fileRef);
    if (fileSnap.exists()) {
      const fileData = fileSnap.data();
      
      // Notify file owner
      await createNotification({
        userId: fileData.createdBy,
        type: 'approval',
        title: 'File Approved!',
        message: `Your file "${fileData.fileName}" has been approved by Exam Unit and is ready for printing`,
        fileId: fileId,
        actionUrl: `/dashboard`
      });

      // Notify HOS
      if (fileData.departmentId) {
        const dept = await getDepartmentById(fileData.departmentId);
        if (dept && dept.hosId) {
          await createNotification({
            userId: dept.hosId,
            type: 'info',
            title: 'File Approved',
            message: `File "${fileData.fileName}" has been approved by Exam Unit`,
            fileId: fileId,
            actionUrl: `/dashboard`
          });
        }
      }

      // Create feedback record
      if (comments) {
        await createFeedback({
          fileId,
          reviewerRole: 'exam_unit',
          reviewerId: examUnitId,
          reviewerName: examUnitName,
          comments,
          action: 'approved'
        });
      }
    }
  } catch (error) {
    console.error('Error approving file:', error);
    throw error;
  }
};

export const examUnitRejectFile = async (fileId, examUnitId, examUnitName, reason) => {
  try {
    const fileRef = doc(db, 'files', fileId);
    await updateDoc(fileRef, {
      workflowStatus: 'NEEDS_REVISION',
      examUnitRejectedAt: serverTimestamp(),
      examUnitRejectedBy: examUnitId,
      examUnitRejectedByName: examUnitName,
      examUnitRejectionReason: reason,
      updatedAt: serverTimestamp()
    });

    // Get file data for notifications
    const fileSnap = await getDoc(fileRef);
    if (fileSnap.exists()) {
      const fileData = fileSnap.data();
      
      // Notify file owner
      await createNotification({
        userId: fileData.createdBy,
        type: 'rejection',
        title: 'Revision Needed',
        message: `Your file "${fileData.fileName}" needs revision. Reason: ${reason}`,
        fileId: fileId,
        actionUrl: `/dashboard`
      });

      // Create feedback record
      await createFeedback({
        fileId,
        reviewerRole: 'exam_unit',
        reviewerId: examUnitId,
        reviewerName: examUnitName,
        comments: reason,
        action: 'rejected'
      });
    }
  } catch (error) {
    console.error('Error rejecting file:', error);
    throw error;
  }
};

/**
 * Upload new version of file
 */
export const uploadNewFileVersion = async (fileId, versionData) => {
  try {
    const fileRef = doc(db, 'files', fileId);
    const fileSnap = await getDoc(fileRef);
    
    if (!fileSnap.exists()) {
      throw new Error('File not found');
    }
    
    const currentVersion = fileSnap.data().version || 1;
    const newVersion = currentVersion + 1;
    
    // Update file metadata
    await updateDoc(fileRef, {
      version: newVersion,
      encryptionKey: versionData.encryptionKey,
      downloadURL: versionData.downloadURL,
      fileName: versionData.fileName,
      fileSize: versionData.fileSize,
      workflowStatus: 'DRAFT',
      versionDescription: versionData.description,
      updatedAt: serverTimestamp()
    });
    
    // Create version record
    await createFileVersion(fileId, {
      version: newVersion,
      encryptionKey: versionData.encryptionKey,
      downloadURL: versionData.downloadURL,
      fileName: versionData.fileName,
      fileSize: versionData.fileSize,
      uploadedBy: versionData.uploadedBy,
      uploadedByName: versionData.uploadedByName,
      description: versionData.description
    });
    
    return newVersion;
  } catch (error) {
    console.error('Error uploading new version:', error);
    throw error;
  }
};

/**
 * Get all files in a department (for HOS dashboard stats)
 */
export const getDepartmentFiles = async (departmentId) => {
  try {
    const filesRef = collection(db, 'files');
    const q = query(filesRef, where('departmentId', '==', departmentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting department files:', error);
    return []; // Return empty array on error
  }
};

/**
 * Get files for HOS review (files from their department)
 */
export const getHOSReviewFiles = async (departmentId) => {
  try {
    const filesRef = collection(db, 'files');
    
    // Try with compound query first
    try {
      const q = query(
        filesRef, 
        where('departmentId', '==', departmentId),
        where('workflowStatus', '==', 'PENDING_HOS_REVIEW'),
        orderBy('submittedForReviewAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (indexError) {
      console.warn('Compound query failed, using simple query:', indexError);
      
      // Fallback to simple query and filter in memory
      const q = query(
        filesRef, 
        where('workflowStatus', '==', 'PENDING_HOS_REVIEW')
      );
      const snapshot = await getDocs(q);
      const allFiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter by departmentId in memory
      return allFiles.filter(file => file.departmentId === departmentId)
        .sort((a, b) => {
          const aTime = a.submittedForReviewAt?.toDate() || new Date(0);
          const bTime = b.submittedForReviewAt?.toDate() || new Date(0);
          return bTime - aTime;
        });
    }
  } catch (error) {
    console.error('Error getting HOS review files:', error);
    throw error;
  }
};

/**
 * Get files for Exam Unit review
 */
export const getExamUnitReviewFiles = async () => {
  try {
    const filesRef = collection(db, 'files');
    const q = query(
      filesRef, 
      where('workflowStatus', '==', 'PENDING_EXAM_UNIT'),
      orderBy('hosApprovedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting exam unit review files:', error);
    throw error;
  }
};

/**
 * Get all approved files
 */
export const getApprovedFiles = async () => {
  try {
    const filesRef = collection(db, 'files');
    const q = query(
      filesRef, 
      where('workflowStatus', '==', 'APPROVED'),
      orderBy('examUnitApprovedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting approved files:', error);
    throw error;
  }
};
