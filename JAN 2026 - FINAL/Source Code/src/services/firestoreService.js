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
  limit,
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
 * Get files with upcoming deadlines (within specified days)
 * Used for showing deadline reminders
 */
export const getFilesWithUpcomingDeadlines = async (userId, withinDays = 7) => {
  try {
    const filesRef = collection(db, 'files');
    const q = query(
      filesRef,
      where('ownerId', '==', userId),
      where('hasDeadline', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const files = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.submissionDeadline) {
        const deadline = data.submissionDeadline.toDate ? data.submissionDeadline.toDate() : new Date(data.submissionDeadline);
        const diffTime = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Include files with deadlines within the specified range (including past deadlines up to -7 days)
        if (diffDays >= -7 && diffDays <= withinDays) {
          files.push({
            id: doc.id,
            ...data,
            daysUntilDeadline: diffDays
          });
        }
      }
    });

    // Sort by deadline (closest first)
    files.sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);

    return files;
  } catch (error) {
    console.error('Error getting files with deadlines:', error);
    throw new Error('Failed to get files with deadlines');
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
 * Record a file download in history
 */
export const recordDownload = async (fileId, userEmail) => {
  try {
    console.log('recordDownload called:', { fileId, userEmail });
    const docRef = doc(db, 'files', fileId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentHistory = docSnap.data().downloadHistory || [];
      console.log('Current download history:', currentHistory);

      // Add to history (use ISO string instead of serverTimestamp in array)
      const newEntry = {
        email: userEmail,
        timestamp: new Date().toISOString()
      };

      const newHistory = [...currentHistory, newEntry];

      console.log('New download history entry:', newEntry);

      // Keep only last 100 downloads
      const trimmedHistory = newHistory.slice(-100);

      await updateDoc(docRef, {
        downloadHistory: trimmedHistory,
        lastDownloaded: serverTimestamp()
      });

      console.log('Download recorded successfully. Total entries:', trimmedHistory.length);
    } else {
      console.error('File document not found:', fileId);
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
    console.log('incrementDownloads called:', { fileId, userEmail });
    const docRef = doc(db, 'files', fileId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentDownloads = docSnap.data().downloads || 0;
      console.log('Current downloads:', currentDownloads);

      await updateDoc(docRef, {
        downloads: currentDownloads + 1,
        lastDownloaded: serverTimestamp()
      });

      console.log('Download count incremented to:', currentDownloads + 1);

      // Also record in history
      await recordDownload(fileId, userEmail);
    } else {
      console.error('File not found for incrementing downloads:', fileId);
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
    const userSnap = await getDoc(userRef);
    const oldRole = userSnap.exists() ? userSnap.data().role : null;

    await updateDoc(userRef, {
      role,
      ...additionalData,
      updatedAt: serverTimestamp()
    });

    // If user was approved (changed from 'pending' to another role), notify them
    if (oldRole === 'pending' && role !== 'pending' && role !== 'rejected') {
      try {
        await createNotification({
          userId: userId,
          type: 'role_assigned',
          title: 'Account Approved!',
          message: `Your account has been approved as ${role.replace('_', ' ').toUpperCase()}. You can now access all features.`,
          actionUrl: '/dashboard'
        });
      } catch (notifError) {
        // Non-critical - log but don't fail role update
        console.warn('Failed to notify user about role approval:', notifError);
      }
    }
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Update user profile (displayName, email, role, department)
 */
export const updateUser = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete user from Firestore
 * Note: Firebase Auth deletion requires Admin SDK on backend
 * This removes user data from Firestore only
 */
export const deleteUser = async (userId) => {
  try {
    // Delete user document from Firestore
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);

    // Note: To delete from Firebase Auth, you need Firebase Admin SDK on backend
    // For now, this only removes Firestore data
    console.log(`User ${userId} data deleted from Firestore. Auth account still exists.`);
  } catch (error) {
    console.error('Error deleting user:', error);
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

// ==================== HOS USER MANAGEMENT ====================

/**
 * Get pending users who requested a specific department
 * Used by HOS to see users waiting for approval in their department
 */
export const getPendingUsersForDepartment = async (departmentId) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', '==', 'pending'),
      where('requestedDepartment', '==', departmentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting pending users for department:', error);
    throw error;
  }
};

/**
 * Get all lecturers in a specific department
 */
export const getDepartmentLecturers = async (departmentId) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', '==', 'lecturer'),
      where('department', '==', departmentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting department lecturers:', error);
    throw error;
  }
};

/**
 * HOS approves a pending user as lecturer in their department
 */
export const hosApproveUser = async (userId, departmentId, approvedBy) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'lecturer',
      department: departmentId,
      approvedBy: approvedBy,
      approvedAt: serverTimestamp(),
      requestedDepartment: null, // Clear the request
      updatedAt: serverTimestamp()
    });

    // Notify the user
    await createNotification({
      userId: userId,
      type: 'role_assigned',
      title: 'Account Approved!',
      message: 'Your account has been approved as LECTURER. You can now upload exam papers.',
      actionUrl: '/dashboard'
    });
  } catch (error) {
    console.error('Error in HOS approve user:', error);
    throw error;
  }
};

/**
 * HOS rejects a pending user
 */
export const hosRejectUser = async (userId, rejectedBy, reason = '') => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'rejected',
      rejectedBy: rejectedBy,
      rejectedAt: serverTimestamp(),
      rejectionReason: reason,
      requestedDepartment: null,
      updatedAt: serverTimestamp()
    });

    // Notify the user
    await createNotification({
      userId: userId,
      type: 'account_rejected',
      title: 'Account Not Approved',
      message: reason || 'Your account request was not approved. Please contact administration.',
      actionUrl: null
    });
  } catch (error) {
    console.error('Error in HOS reject user:', error);
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
    // First, clean up all user assignments related to this department
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const updatePromises = [];

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const updates = {};
      let needsUpdate = false;

      // Clear department field if it matches the deleted department
      if (userData.department === deptId) {
        updates.department = null;
        needsUpdate = true;
      }

      // Remove assigned subjects from this department (for lecturers)
      if (userData.assignedSubjects && Array.isArray(userData.assignedSubjects)) {
        const filteredSubjects = userData.assignedSubjects.filter(
          subject => subject.deptId !== deptId
        );

        // Only update if subjects were removed
        if (filteredSubjects.length !== userData.assignedSubjects.length) {
          updates.assignedSubjects = filteredSubjects;
          needsUpdate = true;
        }
      }

      // Update user if any changes needed
      if (needsUpdate) {
        updates.updatedAt = serverTimestamp();
        const userRef = doc(db, 'users', userDoc.id);
        updatePromises.push(updateDoc(userRef, updates));
      }
    });

    // Wait for all user updates to complete
    await Promise.all(updatePromises);

    // Now delete the department
    const deptRef = doc(db, 'departments', deptId);
    await deleteDoc(deptRef);

    console.log(`Department ${deptId} deleted. Cleaned up ${updatePromises.length} user assignments.`);
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
        deptName: deptSnap.data().name,
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

export const updateSubject = async (deptId, courseId, subjectId, updates) => {
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

    // Update subject fields
    courses[courseIndex].subjects[subjectIndex] = {
      ...courses[courseIndex].subjects[subjectIndex],
      ...updates
    };

    await updateDoc(deptRef, {
      courses,
      updatedAt: serverTimestamp()
    });

    // If subject name or code changed, update lecturer's assigned subjects
    if (updates.subjectName || updates.subjectCode) {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);

      const updatePromises = [];
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData.assignedSubjects && Array.isArray(userData.assignedSubjects)) {
          const updatedSubjects = userData.assignedSubjects.map(subject => {
            if (subject.subjectId === subjectId) {
              return {
                ...subject,
                ...(updates.subjectName && { subjectName: updates.subjectName }),
                ...(updates.subjectCode && { subjectCode: updates.subjectCode })
              };
            }
            return subject;
          });

          // Check if any subject was updated
          const hasChanges = JSON.stringify(updatedSubjects) !== JSON.stringify(userData.assignedSubjects);
          if (hasChanges) {
            const userRef = doc(db, 'users', userDoc.id);
            updatePromises.push(updateDoc(userRef, {
              assignedSubjects: updatedSubjects,
              updatedAt: serverTimestamp()
            }));
          }
        }
      });

      await Promise.all(updatePromises);
    }
  } catch (error) {
    console.error('Error updating subject:', error);
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

/**
 * Create feedback with optional file attachment
 * @param {Object} feedbackData - Feedback data including:
 *   - fileId: The file being reviewed
 *   - reviewerId: User providing feedback 
 *   - reviewerName: Display name of reviewer
 *   - reviewerRole: Role of reviewer (hos/exam_unit)
 *   - comments: Text comments
 *   - action: 'approved' or 'rejected'
 *   - attachmentFileName: Optional attached file name
 *   - attachmentURL: Optional attached file URL
 *   - attachmentSize: Optional attached file size
 */
export const createFeedback = async (feedbackData) => {
  try {
    const feedbackRef = collection(db, 'feedback');
    const docRef = await addDoc(feedbackRef, {
      ...feedbackData,
      hasAttachment: !!(feedbackData.attachmentURL),
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
      emailSent: false,
      createdAt: serverTimestamp()
    });

    // Trigger email notification (non-blocking)
    // The Cloud Function will handle email sending automatically when deployed
    // For development, we can also call email service directly
    try {
      const { sendEmailNotification, generateEmailTemplate, generateTextEmail } = await import('./emailService');

      // Get user data for email
      const userDocRef = doc(db, 'users', notificationData.userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userEmail = userData.email || userData.userEmail;

        // Check if user has email notifications enabled (default: true)
        if (userEmail && userData.emailNotificationsEnabled !== false) {
          const htmlBody = generateEmailTemplate(
            { ...notificationData, createdAt: new Date() },
            userEmail,
            userData.displayName || userData.name
          );
          const textBody = generateTextEmail(
            { ...notificationData, createdAt: new Date() },
            userData.displayName || userData.name
          );

          // Send email (non-blocking - don't wait for it)
          sendEmailNotification({
            to: userEmail,
            subject: notificationData.title || 'New Notification',
            htmlBody,
            textBody
          }).catch(err => {
            console.error('Email sending failed (non-critical):', err);
          });
        }
      }
    } catch (emailError) {
      // Email sending is non-critical, log but don't fail notification creation
      console.warn('Email notification failed (non-critical):', emailError);
    }

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

/**
 * Delete a single notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notificationRef);
    console.log('✅ Notification deleted');
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Clear all notifications for a user (delete permanently)
 */
export const clearAllNotifications = async (userId) => {
  try {
    const notificationRef = collection(db, 'notifications');
    const q = query(notificationRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const deletes = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletes);

    console.log(`✅ Cleared ${snapshot.size} notifications`);
    return snapshot.size;
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    throw error;
  }
};

/**
 * Clear only read notifications for a user
 */
export const clearReadNotifications = async (userId) => {
  try {
    const notificationRef = collection(db, 'notifications');
    const q = query(notificationRef, where('userId', '==', userId), where('read', '==', true));
    const snapshot = await getDocs(q);

    const deletes = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletes);

    console.log(`✅ Cleared ${snapshot.size} read notifications`);
    return snapshot.size;
  } catch (error) {
    console.error('Error clearing read notifications:', error);
    throw error;
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
 * Get all files for HOS to see (pending review, approved by HOS, needs revision, and fully approved)
 */
export const getHOSAllFiles = async (departmentId) => {
  try {
    const filesRef = collection(db, 'files');

    // Include APPROVED so HOS can see files in Approved tab after exam unit approves
    const statuses = ['PENDING_HOS_REVIEW', 'PENDING_EXAM_UNIT', 'NEEDS_REVISION', 'APPROVED'];
    let allFiles = [];

    try {
      // Try compound query first with 'in' operator
      const q = query(
        filesRef,
        where('departmentId', '==', departmentId),
        where('workflowStatus', 'in', statuses)
      );
      const snapshot = await getDocs(q);
      allFiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn('Compound query with "in" failed, falling back to simple query:', err);
      // Fallback: get all files with relevant statuses and filter by department in memory
      const q = query(filesRef, where('workflowStatus', 'in', statuses));
      const snapshot = await getDocs(q);
      allFiles = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(file => file.departmentId === departmentId);
    }

    // Sort by: pending review first, then needs revision, then approved; within same status by date (newest first)
    return allFiles.sort((a, b) => {
      const order = { PENDING_HOS_REVIEW: 0, PENDING_EXAM_UNIT: 1, NEEDS_REVISION: 2, APPROVED: 3 };
      const aOrder = order[a.workflowStatus] ?? 4;
      const bOrder = order[b.workflowStatus] ?? 4;
      if (aOrder !== bOrder) return aOrder - bOrder;
      const aTime = a.submittedForReviewAt?.toDate?.() || a.hosApprovedAt?.toDate?.() || a.examUnitApprovedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.submittedForReviewAt?.toDate?.() || b.hosApprovedAt?.toDate?.() || b.examUnitApprovedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Error getting HOS all files:', error);
    throw error;
  }
};

/**
 * Get files for Exam Unit review (pending only)
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
 * Get all files relevant for Exam Unit (pending review, needs revision, approved)
 */
export const getExamUnitAllFiles = async () => {
  try {
    const filesRef = collection(db, 'files');
    const statuses = ['PENDING_EXAM_UNIT', 'NEEDS_REVISION', 'APPROVED'];

    const q = query(
      filesRef,
      where('workflowStatus', 'in', statuses)
    );
    const snapshot = await getDocs(q);
    const allFiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return allFiles.sort((a, b) => {
      const aTime = a.hosApprovedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.hosApprovedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Error getting exam unit all files:', error);
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

// ==================== AUDIT LOGGING ====================

/**
 * Log an audit event for accountability tracking
 * @param {string} userId - User who performed the action
 * @param {string} userEmail - Email of the user
 * @param {string} action - Action type (FILE_UPLOAD, FILE_DOWNLOAD, FILE_DELETE, FILE_VIEW, etc.)
 * @param {Object} details - Additional details about the action
 */
export const logAuditEvent = async (userId, userEmail, action, details = {}) => {
  try {
    const auditRef = collection(db, 'auditLogs');
    await addDoc(auditRef, {
      userId,
      userEmail,
      action,
      details,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });
    console.log(`📋 Audit log: ${action} by ${userEmail}`);
  } catch (error) {
    // Audit logging should never block the main operation
    console.error('Error logging audit event:', error);
  }
};

/**
 * Get recent audit logs (for Admin Panel)
 * @param {number} maxResults - Maximum number of logs to return
 * @returns {Promise<Array>} Array of audit log entries
 */
export const getAuditLogs = async (maxResults = 50) => {
  try {
    const auditRef = collection(db, 'auditLogs');
    const q = query(auditRef, orderBy('timestamp', 'desc'), limit(maxResults));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return [];
  }
};

/**
 * Get audit logs for a specific file
 * @param {string} fileId - File ID to get logs for
 * @returns {Promise<Array>} Array of audit log entries for the file
 */
export const getFileAuditLogs = async (fileId) => {
  try {
    const auditRef = collection(db, 'auditLogs');
    const q = query(auditRef, where('details.fileId', '==', fileId), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting file audit logs:', error);
    return [];
  }
};

// ==================== PRE-REGISTERED USER WHITELIST ====================

/**
 * Add pre-registered users (whitelist) from Excel import.
 * These entries allow auto-approval when the user self-registers.
 * @param {Array} users - Array of { name, email, role, departmentId, subjects[] }
 * @returns {Object} { added, skipped, errors }
 */
export const addPreRegisteredUsers = async (users) => {
  const results = { added: 0, skipped: 0, errors: [] };

  for (const user of users) {
    try {
      const email = user.email?.trim().toLowerCase();
      if (!email) {
        results.errors.push(`Missing email for row: ${user.name || 'unknown'}`);
        continue;
      }

      // Check if already pre-registered
      const preRegRef = collection(db, 'preRegisteredUsers');
      const existing = query(preRegRef, where('email', '==', email));
      const existingSnap = await getDocs(existing);

      if (!existingSnap.empty) {
        results.skipped++;
        continue;
      }

      // Also check if already a registered user
      const usersRef = collection(db, 'users');
      const existingUser = query(usersRef, where('email', '==', email));
      const existingUserSnap = await getDocs(existingUser);

      if (!existingUserSnap.empty) {
        results.skipped++;
        continue;
      }

      await addDoc(preRegRef, {
        name: user.name || '',
        email: email,
        role: user.role || 'lecturer',
        departmentId: user.departmentId || null,
        departmentName: user.departmentName || null,
        subjects: user.subjects || [],
        claimed: false,
        createdAt: serverTimestamp()
      });

      results.added++;
    } catch (err) {
      results.errors.push(`Error adding ${user.email}: ${err.message}`);
    }
  }

  return results;
};

/**
 * Check if an email is pre-registered (whitelist lookup).
 * @param {string} email
 * @returns {Object|null} Pre-registration data or null
 */
export const getPreRegisteredUser = async (email) => {
  try {
    const preRegRef = collection(db, 'preRegisteredUsers');
    const q = query(preRegRef, where('email', '==', email.trim().toLowerCase()), where('claimed', '==', false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error checking pre-registered user:', error);
    return null;
  }
};

/**
 * Mark a pre-registered entry as claimed (used after user registers).
 * @param {string} preRegId - Document ID in preRegisteredUsers collection
 */
export const markPreRegisteredUserClaimed = async (preRegId) => {
  try {
    const preRegDocRef = doc(db, 'preRegisteredUsers', preRegId);
    await updateDoc(preRegDocRef, {
      claimed: true,
      claimedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking pre-registered user as claimed:', error);
  }
};

/**
 * Get all pre-registered users
 * @returns {Array}
 */
export const getAllPreRegisteredUsers = async () => {
  try {
    const preRegRef = collection(db, 'preRegisteredUsers');
    const q = query(preRegRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting pre-registered users:', error);
    return [];
  }
};

// ==================== BATCH DEPARTMENT IMPORT ====================

/**
 * Batch import department structure from Excel.
 * Rows: { departmentName, deptCode, courseName, courseCode, subjectName, subjectCode }
 * Creates departments/courses/subjects that don't already exist.
 * @returns {Object} { departments, courses, subjects, skipped }
 */
export const batchImportDepartmentStructure = async (rows) => {
  const results = { departments: 0, courses: 0, subjects: 0, skipped: 0, errors: [] };

  // Group rows by department
  const deptMap = {};
  for (const row of rows) {
    const deptKey = row.deptCode?.trim();
    if (!deptKey) continue;

    if (!deptMap[deptKey]) {
      deptMap[deptKey] = {
        name: row.departmentName?.trim() || '',
        code: deptKey,
        courses: {}
      };
    }

    const courseKey = row.courseCode?.trim();
    if (courseKey) {
      if (!deptMap[deptKey].courses[courseKey]) {
        deptMap[deptKey].courses[courseKey] = {
          courseName: row.courseName?.trim() || '',
          courseCode: courseKey,
          subjects: []
        };
      }

      const subjectCode = row.subjectCode?.trim();
      if (subjectCode) {
        deptMap[deptKey].courses[courseKey].subjects.push({
          subjectName: row.subjectName?.trim() || '',
          subjectCode: subjectCode
        });
      }
    }
  }

  // Get existing departments
  const existingDepts = await getDepartments();

  for (const [deptCode, deptData] of Object.entries(deptMap)) {
    try {
      // Find or create department
      let dept = existingDepts.find(d => d.code === deptCode);
      let deptId;

      if (!dept) {
        deptId = await createDepartment({ name: deptData.name, code: deptData.code });
        results.departments++;
        // Re-fetch dept to get its courses
        dept = { id: deptId, courses: [] };
      } else {
        deptId = dept.id;
      }

      // Process courses
      const existingCourses = dept.courses || [];

      for (const [courseCode, courseData] of Object.entries(deptData.courses)) {
        let course = existingCourses.find(c => c.courseCode === courseCode);

        if (!course) {
          const courseId = await addCourseToDepartment(deptId, {
            courseName: courseData.courseName,
            courseCode: courseData.courseCode
          });
          results.courses++;

          // Re-fetch to get course data
          const updatedDept = await getDepartmentById(deptId);
          course = (updatedDept?.courses || []).find(c => c.courseCode === courseCode);
        }

        if (!course) continue;

        // Process subjects
        const existingSubjects = course.subjects || [];

        for (const subjectData of courseData.subjects) {
          const subjectExists = existingSubjects.find(s => s.subjectCode === subjectData.subjectCode);

          if (!subjectExists) {
            await addSubjectToCourse(deptId, course.courseId, subjectData);
            results.subjects++;
          } else {
            results.skipped++;
          }
        }
      }
    } catch (err) {
      results.errors.push(`Error processing dept ${deptCode}: ${err.message}`);
    }
  }

  return results;
};

// ==================== DEADLINE MANAGEMENT ====================

/**
 * Set a deadline at a specific level (department, course, or subject).
 * Stored as a field on the department document to keep data co-located.
 * @param {string} deptId
 * @param {string|null} courseId - null = department-level deadline
 * @param {string|null} subjectId - null = course-level deadline
 * @param {Date} deadline
 */
export const setDeadline = async (deptId, courseId = null, subjectId = null, deadline) => {
  try {
    const deptRef = doc(db, 'departments', deptId);
    const deptSnap = await getDoc(deptRef);

    if (!deptSnap.exists()) throw new Error('Department not found');

    const deptData = deptSnap.data();

    if (!courseId && !subjectId) {
      // Department-level deadline
      await updateDoc(deptRef, {
        deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : null,
        updatedAt: serverTimestamp()
      });
    } else {
      // Course or subject level — modify courses array
      const courses = deptData.courses || [];
      const courseIndex = courses.findIndex(c => c.courseId === courseId);
      if (courseIndex === -1) throw new Error('Course not found');

      if (!subjectId) {
        // Course-level deadline
        courses[courseIndex].deadline = deadline ? Timestamp.fromDate(new Date(deadline)) : null;
      } else {
        // Subject-level deadline
        const subjects = courses[courseIndex].subjects || [];
        const subjectIndex = subjects.findIndex(s => s.subjectId === subjectId);
        if (subjectIndex === -1) throw new Error('Subject not found');

        courses[courseIndex].subjects[subjectIndex].deadline = deadline
          ? Timestamp.fromDate(new Date(deadline))
          : null;
      }

      await updateDoc(deptRef, {
        courses,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error setting deadline:', error);
    throw error;
  }
};

/**
 * Clear a deadline at a specific level.
 */
export const clearDeadline = async (deptId, courseId = null, subjectId = null) => {
  return setDeadline(deptId, courseId, subjectId, null);
};

/**
 * Get the effective deadline for a subject by resolving the cascade:
 * Subject deadline > Course deadline > Department deadline
 * @returns {Date|null}
 */
export const getEffectiveDeadline = (dept, courseId, subjectId) => {
  if (!dept) return null;

  const deptDeadline = dept.deadline
    ? (dept.deadline.toDate ? dept.deadline.toDate() : new Date(dept.deadline))
    : null;

  const course = (dept.courses || []).find(c => c.courseId === courseId);
  if (!course) return deptDeadline;

  const courseDeadline = course.deadline
    ? (course.deadline.toDate ? course.deadline.toDate() : new Date(course.deadline))
    : null;

  const subject = (course.subjects || []).find(s => s.subjectId === subjectId);
  if (!subject) return courseDeadline || deptDeadline;

  const subjectDeadline = subject.deadline
    ? (subject.deadline.toDate ? subject.deadline.toDate() : new Date(subject.deadline))
    : null;

  // Subject > Course > Department (most specific wins)
  return subjectDeadline || courseDeadline || deptDeadline;
};

/**
 * Get effective deadlines for all assigned subjects of a lecturer.
 * @param {Array} assignedSubjects - [{deptId, courseId, subjectId, ...}]
 * @param {Array} departments - All departments data
 * @returns {Object} Map of subjectId -> { deadline, daysLeft, status }
 */
export const getSubjectDeadlines = (assignedSubjects, departments) => {
  const deadlineMap = {};

  for (const subject of assignedSubjects) {
    const dept = departments.find(d => d.id === subject.deptId);
    const deadline = getEffectiveDeadline(dept, subject.courseId, subject.subjectId);

    if (deadline) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      const diffTime = deadlineDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status = 'normal'; // > 7 days
      if (daysLeft < 0) status = 'overdue';
      else if (daysLeft <= 3) status = 'critical'; // 0-3 days
      else if (daysLeft <= 7) status = 'warning'; // 4-7 days

      deadlineMap[subject.subjectId] = {
        deadline: deadlineDate,
        daysLeft,
        status
      };
    }
  }

  return deadlineMap;
};
