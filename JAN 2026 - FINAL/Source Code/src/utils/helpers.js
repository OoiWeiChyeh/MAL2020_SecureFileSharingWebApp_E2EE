import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from './constants';

/**
 * Format file size to human-readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format date to readable format
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Validate file type
 */
export const isValidFileType = (file) => {
  return Object.keys(SUPPORTED_FILE_TYPES).includes(file.type);
};

/**
 * Validate file size
 */
export const isValidFileSize = (file) => {
  return file.size <= MAX_FILE_SIZE;
};

/**
 * Get file icon based on type
 */
export const getFileIcon = (mimeType) => {
  return SUPPORTED_FILE_TYPES[mimeType]?.icon || 'File';
};

/**
 * Get file extension
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
};

/**
 * Generate unique ID
 */
export const generateId = () => {
  return crypto.randomUUID();
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

/**
 * Download blob as file
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 30) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

/**
 * Format deadline date (date only, no time)
 */
export const formatDeadline = (timestamp) => {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

/**
 * Get days until deadline
 */
export const getDaysUntilDeadline = (timestamp) => {
  if (!timestamp) return null;
  const deadline = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if deadline is soon (within 3 days)
 */
export const isDeadlineSoon = (timestamp) => {
  const days = getDaysUntilDeadline(timestamp);
  return days !== null && days >= 0 && days <= 3;
};

/**
 * Check if deadline has passed
 */
export const isPastDeadline = (timestamp) => {
  const days = getDaysUntilDeadline(timestamp);
  return days !== null && days < 0;
};
