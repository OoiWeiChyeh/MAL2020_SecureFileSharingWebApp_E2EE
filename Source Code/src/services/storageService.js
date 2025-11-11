import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Upload encrypted file to Firebase Storage
 * @param {string} userId - User ID
 * @param {string} fileId - Unique file ID
 * @param {Uint8Array} encryptedData - Encrypted file data
 * @param {string} filename - Original filename
 * @returns {Promise<string>} Download URL
 */
export const uploadEncryptedFile = async (userId, fileId, encryptedData, filename) => {
  try {
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const storageRef = ref(storage, `users/${userId}/${fileId}/${filename}.enc`);
    
    const metadata = {
      contentType: 'application/octet-stream',
      customMetadata: {
        encrypted: 'true',
        uploadedAt: new Date().toISOString()
      }
    };
    
    await uploadBytes(storageRef, blob, metadata);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file to storage');
  }
};

/**
 * Download encrypted file from Firebase Storage
 * @param {string} downloadURL - File download URL
 * @returns {Promise<Uint8Array>} Encrypted file data
 */
export const downloadEncryptedFile = async (downloadURL) => {
  try {
    console.log('Downloading from URL:', downloadURL);

    // Add alt=media if not already present to get the actual file content
    const urlWithAlt = downloadURL.includes('alt=media') ? downloadURL : `${downloadURL}${downloadURL.includes('?') ? '&' : '?'}alt=media`;

    const response = await fetch(urlWithAlt, {
      method: 'GET',
      headers: {
        'Accept': 'application/octet-stream',
      },
      // Try without credentials first for public files
      credentials: 'omit'
    });

    if (!response.ok) {
      console.error('Download failed with status:', response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('Downloaded file size:', arrayBuffer.byteLength, 'bytes');

    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error('Error downloading file:', error);

    if (error.message.includes('fetch')) {
      throw new Error('Network error - please check your internet connection');
    } else if (error.message.includes('HTTP 404')) {
      throw new Error('File not found - it may have been deleted');
    } else if (error.message.includes('HTTP 403')) {
      throw new Error('Access denied - you may not have permission to download this file');
    } else if (error.message.includes('HTTP 401')) {
      throw new Error('Authentication required - please log in again');
    }

    throw new Error(`Failed to download file from storage: ${error.message}`);
  }
};

/**
 * Delete file from Firebase Storage
 * @param {string} userId - User ID
 * @param {string} fileId - File ID
 * @param {string} filename - Filename
 * @returns {Promise<void>}
 */
export const deleteFile = async (userId, fileId, filename) => {
  try {
    const storageRef = ref(storage, `users/${userId}/${fileId}/${filename}.enc`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file from storage');
  }
};

/**
 * List all files for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of file references
 */
export const listUserFiles = async (userId) => {
  try {
    const storageRef = ref(storage, `users/${userId}`);
    const result = await listAll(storageRef);
    return result.items;
  } catch (error) {
    console.error('Error listing files:', error);
    throw new Error('Failed to list files');
  }
};

/**
 * Get file metadata
 * @param {string} userId - User ID
 * @param {string} fileId - File ID
 * @param {string} filename - Filename
 * @returns {Promise<Object>} File metadata
 */
export const getFileMetadata = async (userId, fileId, filename) => {
  try {
    const storageRef = ref(storage, `users/${userId}/${fileId}/${filename}.enc`);
    const metadata = await getMetadata(storageRef);
    return metadata;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw new Error('Failed to get file metadata');
  }
};
