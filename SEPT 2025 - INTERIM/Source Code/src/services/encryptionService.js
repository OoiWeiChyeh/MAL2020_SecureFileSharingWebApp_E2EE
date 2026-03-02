import { ENCRYPTION_ALGORITHM } from '../utils/constants';

/**
 * Generate a new AES-256 key for file encryption
 * @returns {Promise<string>} Base64 encoded key
 */
export async function generateAESKey() {
  try {
    const key = await crypto.subtle.generateKey(
      { 
        name: ENCRYPTION_ALGORITHM.name, 
        length: ENCRYPTION_ALGORITHM.length 
      },
      true,
      ["encrypt", "decrypt"]
    );
    
    const exported = await crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  } catch (error) {
    console.error('Error generating AES key:', error);
    throw new Error('Failed to generate encryption key');
  }
}

/**
 * Encrypt a file using AES-GCM
 * @param {File} file - File to encrypt
 * @param {string} base64Key - Base64 encoded encryption key
 * @returns {Promise<{data: Uint8Array, iv: Uint8Array}>} Encrypted data with IV
 */
export async function encryptFile(file, base64Key) {
  try {
    // Import the key
    const keyBytes = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw", 
      keyBytes, 
      ENCRYPTION_ALGORITHM.name, 
      false, 
      ["encrypt"]
    );
    
    // Generate random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_ALGORITHM.ivLength));
    
    // Read file as array buffer
    const buffer = await file.arrayBuffer();
    
    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: ENCRYPTION_ALGORITHM.name, iv }, 
      key, 
      buffer
    );
    
    // Prepend IV to encrypted data (needed for decryption)
    const encryptedData = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
    
    return { 
      data: encryptedData, 
      iv: iv 
    };
  } catch (error) {
    console.error('Error encrypting file:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt a file using AES-GCM
 * @param {Uint8Array} encryptedData - Encrypted data with IV prepended
 * @param {string} base64Key - Base64 encoded encryption key
 * @returns {Promise<Blob>} Decrypted file as Blob
 */
export async function decryptFile(encryptedData, base64Key) {
  try {
    // Import the key
    const keyBytes = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw", 
      keyBytes, 
      ENCRYPTION_ALGORITHM.name, 
      false, 
      ["decrypt"]
    );
    
    // Extract IV from the beginning
    const iv = encryptedData.slice(0, ENCRYPTION_ALGORITHM.ivLength);
    const cipher = encryptedData.slice(ENCRYPTION_ALGORITHM.ivLength);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM.name, iv }, 
      key, 
      cipher
    );
    
    return new Blob([decrypted]);
  } catch (error) {
    console.error('Error decrypting file:', error);
    throw new Error('Failed to decrypt file - invalid key or corrupted file');
  }
}

/**
 * Encrypt text data (for key encryption)
 * @param {string} text - Text to encrypt
 * @param {string} password - Password to derive key from
 * @returns {Promise<string>} Base64 encoded encrypted text
 */
export async function encryptText(text, password) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Derive key from password
    const passwordKey = await deriveKeyFromPassword(password);
    const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_ALGORITHM.ivLength));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: ENCRYPTION_ALGORITHM.name, iv },
      passwordKey,
      data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Error encrypting text:', error);
    throw new Error('Failed to encrypt text');
  }
}

/**
 * Decrypt text data
 * @param {string} base64Encrypted - Base64 encoded encrypted text
 * @param {string} password - Password to derive key from
 * @returns {Promise<string>} Decrypted text
 */
export async function decryptText(base64Encrypted, password) {
  try {
    const combined = Uint8Array.from(atob(base64Encrypted), c => c.charCodeAt(0));
    const iv = combined.slice(0, ENCRYPTION_ALGORITHM.ivLength);
    const encrypted = combined.slice(ENCRYPTION_ALGORITHM.ivLength);
    
    const passwordKey = await deriveKeyFromPassword(password);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM.name, iv },
      passwordKey,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Error decrypting text:', error);
    throw new Error('Failed to decrypt text');
  }
}

/**
 * Derive encryption key from password using PBKDF2
 * @param {string} password - Password
 * @returns {Promise<CryptoKey>} Derived key
 */
async function deriveKeyFromPassword(password) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const importedKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  
  // Use a fixed salt for simplicity (in production, use unique salt per user)
  const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    importedKey,
    { name: ENCRYPTION_ALGORITHM.name, length: ENCRYPTION_ALGORITHM.length },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Verify if encryption is available
 * @returns {boolean} True if Web Crypto API is available
 */
export function isEncryptionAvailable() {
  return !!(window.crypto && window.crypto.subtle);
}

/**
 * Generate hash of data (for integrity verification)
 * @param {ArrayBuffer} data - Data to hash
 * @returns {Promise<string>} Base64 encoded hash
 */
export async function generateHash(data) {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  } catch (error) {
    console.error('Error generating hash:', error);
    throw new Error('Failed to generate hash');
  }
}
