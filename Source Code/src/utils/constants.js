// Supported file types
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': { ext: 'pdf', icon: 'FileText' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', icon: 'FileText' },
  'application/msword': { ext: 'doc', icon: 'FileText' },
  'image/png': { ext: 'png', icon: 'Image' },
  'image/jpeg': { ext: 'jpg', icon: 'Image' },
  'image/jpg': { ext: 'jpg', icon: 'Image' },
  'text/plain': { ext: 'txt', icon: 'FileText' },
  'application/zip': { ext: 'zip', icon: 'Archive' },
  'video/mp4': { ext: 'mp4', icon: 'Video' },
  'audio/mpeg': { ext: 'mp3', icon: 'Music' }
};

// Max file size (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Encryption algorithm
export const ENCRYPTION_ALGORITHM = {
  name: 'AES-GCM',
  length: 256,
  ivLength: 12
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  UPLOAD: '/upload',
  SHARE: '/share',
  VIEW_FILE: '/file',
  SETTINGS: '/settings'
};

// Local storage keys
export const STORAGE_KEYS = {
  USER: 'secure_share_user',
  THEME: 'secure_share_theme'
};

// Share types
export const SHARE_TYPES = {
  LINK: 'link',
  QR: 'qr',
  EMAIL: 'email'
};

// File status
export const FILE_STATUS = {
  UPLOADING: 'uploading',
  READY: 'ready',
  SHARED: 'shared',
  DOWNLOADED: 'downloaded'
};
