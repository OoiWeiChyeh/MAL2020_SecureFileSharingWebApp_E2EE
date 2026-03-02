import { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { generateAESKey, encryptFile } from '../services/encryptionService';
import { uploadEncryptedFile } from '../services/storageService';
import { uploadNewFileVersion } from '../services/firestoreService';
import { getCurrentUser } from '../services/authService';
import { isValidFileType, isValidFileSize, formatFileSize } from '../utils/helpers';
import { MAX_FILE_SIZE } from '../utils/constants';

export default function UploadNewVersionModal({ fileId, currentVersion, onClose, onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setError('');

    if (!file) return;

    if (!isValidFileType(file)) {
      setError('Unsupported file type. Please upload PDF, DOCX, PNG, JPG, TXT, ZIP, MP4, or MP3 files.');
      return;
    }

    if (!isValidFileSize(file)) {
      setError(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !description.trim()) {
      setError('Please select a file and provide a description');
      return;
    }

    const user = getCurrentUser();
    if (!user) return;

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      // Step 1: Generate encryption key
      setProgress(20);
      const encryptionKey = await generateAESKey();

      // Step 2: Encrypt file
      setProgress(40);
      const { data: encryptedData } = await encryptFile(selectedFile, encryptionKey);

      // Step 3: Upload to Firebase Storage
      setProgress(60);
      const downloadURL = await uploadEncryptedFile(
        user.uid,
        `${fileId}_v${currentVersion + 1}`,
        encryptedData,
        selectedFile.name
      );

      // Step 4: Create new version in Firestore
      setProgress(80);
      await uploadNewFileVersion(fileId, {
        encryptionKey,
        downloadURL,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        uploadedBy: user.uid,
        uploadedByName: user.displayName || user.email,
        description: description.trim()
      });

      setProgress(100);
      
      // Success!
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error uploading new version:', err);
      setError(err.message || 'Failed to upload new version');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Upload New Version</h3>
            <p className="text-sm text-gray-600 mt-1">
              Current version: v{currentVersion}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!selectedFile ? (
            <div>
              <label htmlFor="version-file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Click to select new version
                  </p>
                  <p className="text-xs text-gray-500">
                    Max {formatFileSize(MAX_FILE_SIZE)}
                  </p>
                </div>
              </label>
              <input
                id="version-file-upload"
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.zip,.mp4,.mp3"
                disabled={uploading}
              />
            </div>
          ) : (
            <>
              {/* Selected File Info */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  {!uploading && (
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-blue-200 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What changed? *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Fixed typos in question 3, Updated answer key..."
                  disabled={uploading}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe what was changed in this version
                </p>
              </div>

              {/* Progress */}
              {uploading && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="font-medium text-gray-900">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Note:</strong> Uploading a new version will reset the file status to DRAFT. 
                  You'll need to submit it for review again.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !description.trim() || uploading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Version {currentVersion + 1}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

