import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateAESKey, encryptFile } from '../services/encryptionService';
import { uploadEncryptedFile } from '../services/storageService';
import { saveFileMetadata, getLecturerAssignedSubjects, getUserRole, createFileVersion } from '../services/firestoreService';
import { getCurrentUser } from '../services/authService';
import { isValidFileType, isValidFileSize, formatFileSize, generateId } from '../utils/helpers';
import { MAX_FILE_SIZE } from '../utils/constants';
import Navbar from '../components/Navbar';
import { Upload as UploadIcon, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { value: 'question-paper', label: '📄 Question Paper' },
  { value: 'answer-key', label: '✓ Answer Key' },
  { value: 'rubric', label: '📋 Rubric' },
  { value: 'marking-scheme', label: '🎯 Marking Scheme' },
  { value: 'model-answer', label: '⭐ Model Answer' },
  { value: 'other', label: '📎 Other' }
];

export default function Upload() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      const user = getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const role = await getUserRole(user.uid);
        setUserRole(role);

        // Only lecturers can upload files
        if (role !== 'lecturer') {
          navigate('/dashboard');
          return;
        }

        // Load lecturer's assigned subjects
        const subjects = await getLecturerAssignedSubjects(user.uid);
        setAssignedSubjects(subjects);
        if (subjects.length > 0) {
          setSelectedSubject(subjects[0]);
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [navigate]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setError('');
    setSuccess(false);

    if (!file) return;

    // Validate file type
    if (!isValidFileType(file)) {
      setError('Unsupported file type. Please upload PDF, DOCX, PNG, JPG, TXT, ZIP, MP4, or MP3 files.');
      return;
    }

    // Validate file size
    if (!isValidFileSize(file)) {
      setError(`File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }

    // Validate lecturer has selected subject
    if (userRole === 'lecturer' && !selectedSubject) {
      setError('Please select a subject before uploading');
      return;
    }

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
      const fileId = generateId();
      const downloadURL = await uploadEncryptedFile(
        user.uid,
        fileId,
        encryptedData,
        selectedFile.name
      );

      // Step 4: Save metadata to Firestore
      setProgress(80);
      
      const metadata = {
        fileId,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        encryptionKey: encryptionKey,
        downloadURL: downloadURL,
        encrypted: true,
        category: selectedCategory,
        createdBy: user.uid,
        createdByName: user.displayName || user.email,
        workflowStatus: 'DRAFT',
        version: 1,
        versionDescription: 'Initial version'
      };

      // Add subject info if lecturer
      if (userRole === 'lecturer' && selectedSubject) {
        metadata.subjectId = selectedSubject.subjectId;
        metadata.subjectCode = selectedSubject.subjectCode;
        metadata.subjectName = selectedSubject.subjectName;
        metadata.departmentId = selectedSubject.deptId;
        metadata.departmentName = selectedSubject.deptName;
        metadata.courseId = selectedSubject.courseId;
      }
      
      const savedFileId = await saveFileMetadata(user.uid, metadata);

      // Create initial version record
      await createFileVersion(savedFileId, {
        version: 1,
        encryptionKey: encryptionKey,
        downloadURL: downloadURL,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        uploadedBy: user.uid,
        uploadedByName: user.displayName || user.email,
        description: 'Initial version'
      });

      setProgress(100);
      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.message || 'Failed to upload file');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    setSuccess(false);
    setProgress(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
          <h1 className="text-3xl font-bold text-gray-900">Upload File</h1>
          <p className="text-gray-600">Upload and encrypt your exam files securely</p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {!selectedFile ? (
            <div>
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
                  <UploadIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, DOCX, PNG, JPG, TXT, ZIP, MP4, MP3 (max {formatFileSize(MAX_FILE_SIZE)})
                  </p>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.zip,.mp4,.mp3"
                  />
                </div>
              </label>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* File Preview */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <File className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  {!uploading && !success && (
                    <button
                      onClick={handleRemoveFile}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Subject Selection (for Lecturers) */}
              {!uploading && !success && userRole === 'lecturer' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    📚 Subject *
                  </label>
                  {assignedSubjects.length > 0 ? (
                    <select
                      value={selectedSubject ? selectedSubject.subjectId : ''}
                      onChange={(e) => {
                        const subject = assignedSubjects.find(s => s.subjectId === e.target.value);
                        setSelectedSubject(subject);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {assignedSubjects.map(subject => (
                        <option key={subject.subjectId} value={subject.subjectId}>
                          {subject.subjectCode} - {subject.subjectName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        No subjects assigned yet. Please contact the Exam Unit to assign you to a subject.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Category Selection */}
              {!uploading && !success && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    File Category
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === cat.value
                            ? 'bg-blue-600 text-white border border-blue-600'
                            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This helps organize your files in the dashboard
                  </p>
                </div>
              )}


              {/* Progress Bar */}
              {uploading && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Encrypting and uploading...</span>
                    <span className="text-sm font-medium text-blue-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900">File uploaded successfully!</p>
                    <p className="text-sm text-green-700">Redirecting to dashboard...</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Security Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 font-medium mb-2">🔒 End-to-End Encryption</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• File will be encrypted in your browser using AES-256-GCM</li>
                  <li>• Unique encryption key generated for this file</li>
                  <li>• Only encrypted data is uploaded to the server</li>
                  <li>• You control who can access your file</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading || success}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Uploaded
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-5 h-5" />
                      Upload & Encrypt
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  disabled={uploading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Supported Files */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Supported File Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['PDF', 'DOCX', 'PNG/JPG', 'TXT', 'ZIP', 'MP4', 'MP3'].map((type) => (
              <div key={type} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
