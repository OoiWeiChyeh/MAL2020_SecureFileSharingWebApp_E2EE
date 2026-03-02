import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { getFileMetadata, incrementDownloads } from '../services/firestoreService';
import { getCurrentUser } from '../services/authService';
import { downloadEncryptedFile } from '../services/storageService';
import { decryptFile } from '../services/encryptionService';
import { downloadBlob, formatFileSize, formatDate } from '../utils/helpers';
import Navbar from '../components/Navbar';
import { Download, Lock, Loader2, AlertCircle, CheckCircle, File } from 'lucide-react';

export default function ViewFile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fileId: pathFileId } = useParams();
  
  // Get fileId from either URL path or search params
  const fileId = pathFileId || searchParams.get('id');
  const encryptionKey = searchParams.get('key');

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!fileId) {
      setError('Invalid file link - missing file ID');
      setLoading(false);
      return;
    }
    loadFile();
  }, [fileId, encryptionKey]);

  const loadFile = async () => {
    try {
      setLoading(true);
      const fileData = await getFileMetadata(fileId);
      setFile(fileData);
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Failed to load file metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    setDownloading(true);
    setError('');
    setSuccess('');

    try {
      // Validate download URL
      if (!file.downloadURL) {
        throw new Error('Download URL not found - file metadata may be corrupted');
      }

      console.log('File metadata:', {
        fileId: fileId,
        fileName: file.fileName,
        downloadURL: file.downloadURL,
        hasEncryptionKey: !!file.encryptionKey,
        keyLength: file.encryptionKey?.length
      });

      // Use the encryption key from Firestore (more reliable than URL parameter)
      const keyToUse = file.encryptionKey || encryptionKey;

      if (!keyToUse) {
        throw new Error('Encryption key not found. This file may have been uploaded before the encryption key fix.');
      }

      // Download encrypted file
      const encryptedData = await downloadEncryptedFile(file.downloadURL);

      if (encryptedData.length === 0) {
        throw new Error('Downloaded file is empty - file may be corrupted');
      }

      console.log('Downloaded encrypted data size:', encryptedData.length, 'bytes');

      // Decrypt file using the correct key from Firestore
      const decryptedBlob = await decryptFile(encryptedData, keyToUse);

      if (!decryptedBlob || decryptedBlob.size === 0) {
        throw new Error('Decryption resulted in empty file - encryption key may be invalid');
      }

      console.log('Decrypted file size:', decryptedBlob.size, 'bytes');

      // Download file
      downloadBlob(decryptedBlob, file.fileName);

      // Increment download count
      const user = getCurrentUser();
      const userEmail = user?.email || 'anonymous';
      await incrementDownloads(fileId, userEmail);

      setSuccess('File downloaded and decrypted successfully!');
    } catch (err) {
      console.error('Error downloading file:', err);

      // Provide more specific error messages
      if (err.message.includes('HTTP 404')) {
        setError('File not found in storage. It may have been deleted or the upload failed.');
      } else if (err.message.includes('HTTP 403') || err.message.includes('HTTP 401')) {
        setError('Access denied. Please make sure you\'re logged in and have permission to download this file.');
      } else if (err.message.includes('Network error')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.message.includes('empty file') || err.message.includes('invalid key')) {
        setError('File decryption failed. The encryption key may be corrupted or the file may be damaged.');
      } else if (err.message.includes('Download URL not found')) {
        setError('File metadata is corrupted. Please try re-uploading the file.');
      } else {
        setError(`Failed to download file: ${err.message}`);
      }
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading file...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !file) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">Error Loading File</h2>
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">View File</h1>
          <p className="text-gray-600">Download and decrypt file locally</p>
        </div>

        {/* File Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* File Icon and Name */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <File className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{file?.fileName}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>{formatFileSize(file?.fileSize)}</span>
                <span>•</span>
                <span>{file?.fileType}</span>
                {file?.createdAt && (
                  <>
                    <span>•</span>
                    <span>{formatDate(file.createdAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Security Info */}
          <div className="flex items-center gap-2 mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Lock className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">
              <span className="font-medium">Secure download:</span> File is encrypted in storage and decrypted locally in your browser
            </p>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Downloading & Decrypting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download & Decrypt File
              </>
            )}
          </button>
        </div>

        {/* File Info */}
        {file && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">File Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">File Name:</span>
                <span className="text-gray-900 font-medium">{file.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File Size:</span>
                <span className="text-gray-900 font-medium">{formatFileSize(file.fileSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File Type:</span>
                <span className="text-gray-900 font-medium">{file.fileType}</span>
              </div>
              {file.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Uploaded:</span>
                  <span className="text-gray-900 font-medium">{formatDate(file.createdAt)}</span>
                </div>
              )}
              {file.downloads !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Downloads:</span>
                  <span className="text-gray-900 font-medium">{file.downloads}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Encryption:</span>
                <span className="text-gray-900 font-medium">AES-256-GCM</span>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
