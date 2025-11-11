import { 
  collection, 
  doc, 
  addDoc,
  getDoc, 
  getDocs, 
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { uploadEncryptedFile } from './storageService';

/**
 * File workflow statuses
 */
export const FILE_STATUS = {
  DRAFT: 'draft',
  PENDING_HOS: 'pending_hos',
  NEEDS_REVISION: 'needs_revision',
  PENDING_EXAM_UNIT: 'pending_exam_unit',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

/**
 * Create a new file with initial version
 */
export const createFileWithVersion = async (userId, fileData, encryptedData, originalFileName) => {
  try {
    // Create main file record
    const filesRef = collection(db, 'files');
    const fileDoc = await addDoc(filesRef, {
      fileName: originalFileName,
      department: fileData.department,
      departmentId: fileData.departmentId,
      course: fileData.course,
      courseId: fileData.courseId,
      subject: fileData.subject,
      subjectId: fileData.subjectId,
      subjectCode: fileData.subjectCode,
      createdBy: userId,
      createdByName: fileData.createdByName,
      currentVersion: 1,
      status: FILE_STATUS.DRAFT,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    const fileId = fileDoc.id;
    
    // Upload encrypted file to storage
    const storagePath = `files/${userId}/${fileId}/v1_${originalFileName}.enc`;
    const downloadURL = await uploadEncryptedFile(
      fileId,
      encryptedData,
      originalFileName
    );
    
    // Create version record
    const versionsRef = collection(db, 'fileVersions');
    await addDoc(versionsRef, {
      fileId: fileId,
      version: 1,
      fileName: originalFileName,
      fileSize: fileData.fileSize,
      fileType: fileData.fileType,
      encryptionKey: fileData.encryptionKey,
      downloadURL: downloadURL,
      uploadedBy: userId,
      uploadedByName: fileData.createdByName,
      changeDescription: 'Initial version',
      status: FILE_STATUS.DRAFT,
      uploadedAt: serverTimestamp()
    });
    
    return fileId;
  } catch (error) {
    console.error('Error creating file with version:', error);
    throw error;
  }
};

/**
 * Add a new version to existing file
 */
export const addFileVersion = async (fileId, userId, fileData, encryptedData, originalFileName, changeDescription) => {
  try {
    // Get current file
    const fileRef = doc(db, 'files', fileId);
    const fileSnap = await getDoc(fileRef);
    
    if (!fileSnap.exists()) {
      throw new Error('File not found');
    }
    
    const currentFile = fileSnap.data();
    const newVersion = (currentFile.currentVersion || 1) + 1;
    
    // Upload encrypted file to storage
    const downloadURL = await uploadEncryptedFile(
      fileId,
      encryptedData,
      `v${newVersion}_${originalFileName}`
    );
    
    // Create version record
    const versionsRef = collection(db, 'fileVersions');
    await addDoc(versionsRef, {
      fileId: fileId,
      version: newVersion,
      fileName: originalFileName,
      fileSize: fileData.fileSize,
      fileType: fileData.fileType,
      encryptionKey: fileData.encryptionKey,
      downloadURL: downloadURL,
      uploadedBy: userId,
      uploadedByName: fileData.uploadedByName,
      changeDescription: changeDescription || `Version ${newVersion}`,
      status: FILE_STATUS.DRAFT,
      uploadedAt: serverTimestamp()
    });
    
    // Update main file record
    await updateDoc(fileRef, {
      currentVersion: newVersion,
      fileName: originalFileName,
      status: FILE_STATUS.DRAFT,
      updatedAt: serverTimestamp()
    });
    
    return newVersion;
  } catch (error) {
    console.error('Error adding file version:', error);
    throw error;
  }
};

/**
 * Get all versions of a file
 */
export const getFileVersions = async (fileId) => {
  try {
    const versionsRef = collection(db, 'fileVersions');
    const q = query(
      versionsRef, 
      where('fileId', '==', fileId),
      orderBy('version', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting file versions:', error);
    throw error;
  }
};

/**
 * Get specific version of a file
 */
export const getFileVersion = async (fileId, version) => {
  try {
    const versionsRef = collection(db, 'fileVersions');
    const q = query(
      versionsRef,
      where('fileId', '==', fileId),
      where('version', '==', version)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting file version:', error);
    throw error;
  }
};

/**
 * Update file status (for workflow)
 */
export const updateFileStatus = async (fileId, newStatus) => {
  try {
    const fileRef = doc(db, 'files', fileId);
    await updateDoc(fileRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating file status:', error);
    throw error;
  }
};

/**
 * Submit file for review (Lecturer action)
 */
export const submitFileForReview = async (fileId) => {
  try {
    await updateFileStatus(fileId, FILE_STATUS.PENDING_HOS);
  } catch (error) {
    console.error('Error submitting file for review:', error);
    throw error;
  }
};

/**
 * Get files by status
 */
export const getFilesByStatus = async (status) => {
  try {
    const filesRef = collection(db, 'files');
    const q = query(filesRef, where('status', '==', status));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting files by status:', error);
    throw error;
  }
};

/**
 * Get files for lecturer
 */
export const getFilesForLecturer = async (lecturerId) => {
  try {
    const filesRef = collection(db, 'files');
    const q = query(filesRef, where('createdBy', '==', lecturerId), orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting files for lecturer:', error);
    throw error;
  }
};

/**
 * Get files for HOS (by department)
 */
export const getFilesForDepartment = async (departmentId) => {
  try {
    const filesRef = collection(db, 'files');
    const q = query(
      filesRef, 
      where('departmentId', '==', departmentId),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting files for department:', error);
    throw error;
  }
};

/**
 * Get all files (for Exam Unit)
 */
export const getAllFiles = async () => {
  try {
    const filesRef = collection(db, 'files');
    const q = query(filesRef, orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all files:', error);
    throw error;
  }
};

