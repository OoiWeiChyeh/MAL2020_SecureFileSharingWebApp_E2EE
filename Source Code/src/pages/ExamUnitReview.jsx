import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { 
  getUserRole, 
  getExamUnitReviewFiles, 
  examUnitApproveFile, 
  examUnitRejectFile,
  getFileFeedback,
  getDepartments
} from '../services/firestoreService';
import Navbar from '../components/Navbar';
import FileCard from '../components/FileCard';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  AlertCircle,
  Loader2,
  Download,
  Eye,
  Award
} from 'lucide-react';
import { formatFileSize, formatDate } from '../utils/helpers';

export default function ExamUnitReview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkAccessAndLoad();
  }, []);

  const checkAccessAndLoad = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const role = await getUserRole(user.uid);
      if (role !== 'exam_unit') {
        navigate('/dashboard');
        return;
      }

      await loadData();
    } catch (err) {
      console.error('Error checking access:', err);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [reviewFiles, depts] = await Promise.all([
        getExamUnitReviewFiles(),
        getDepartments()
      ]);
      
      setFiles(reviewFiles);
      setDepartments(depts);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (file) => {
    navigate(`/file?id=${file.id}&key=${encodeURIComponent(file.encryptionKey)}`);
  };

  const handleReview = async (file, action) => {
    setSelectedFile(file);
    setReviewAction(action);
    setComments('');
    
    // Load existing feedback
    try {
      const fileFeedback = await getFileFeedback(file.id);
      setFeedback(fileFeedback);
    } catch (err) {
      console.error('Error loading feedback:', err);
    }
    
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedFile) return;

    const user = getCurrentUser();
    
    try {
      setSubmitting(true);
      setError('');

      if (reviewAction === 'approve') {
        await examUnitApproveFile(selectedFile.id, user.uid, user.displayName || user.email, comments);
        setSuccess('File approved! Ready for printing.');
      } else {
        if (!comments.trim()) {
          setError('Please provide a reason for rejection');
          return;
        }
        await examUnitRejectFile(selectedFile.id, user.uid, user.displayName || user.email, comments);
        setSuccess('File rejected. Lecturer has been notified.');
      }

      setShowReviewModal(false);
      setSelectedFile(null);
      setComments('');
      await loadData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'Unknown';
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exam Unit Final Review</h1>
          <p className="text-gray-600 mt-1">Review HOS-approved files for final approval</p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{files.length}</p>
                <p className="text-sm text-gray-600">Pending Final Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-600">Approved Today</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-sm text-gray-600">Rejected Today</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                <p className="text-sm text-gray-600">Departments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Files Awaiting Final Approval</h2>
            <p className="text-sm text-gray-600 mt-1">These files have been approved by HOS</p>
          </div>

          {files.length === 0 ? (
            <div className="p-12 text-center">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No files pending final review</p>
              <p className="text-sm text-gray-500">HOS-approved files will appear here</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {files.map((file) => (
                  <div key={file.id} className="space-y-3">
                    <FileCard 
                      file={file} 
                      isOwner={false}
                      userRole="exam_unit"
                      onDeleted={loadData}
                    />
                    {file.hosComments && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-medium text-blue-900 mb-1">HOS Comments:</p>
                        <p className="text-sm text-blue-800">{file.hosComments}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(file, 'approve')}
                        className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(file, 'reject')}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {reviewAction === 'approve' ? 'Final Approval' : 'Reject File'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{selectedFile.fileName}</p>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* HOS Approval Info */}
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">HOS Approved</span>
                </div>
                <p className="text-sm text-green-800">
                  Approved by {selectedFile.hosApprovedByName} on {selectedFile.hosApprovedAt ? formatDate(selectedFile.hosApprovedAt) : 'N/A'}
                </p>
                {selectedFile.hosComments && (
                  <p className="text-sm text-green-800 mt-2 italic">
                    "{selectedFile.hosComments}"
                  </p>
                )}
              </div>

              {/* Previous Feedback */}
              {feedback.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Review History
                  </h4>
                  <div className="space-y-2">
                    {feedback.map((fb, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{fb.reviewerName}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-500 capitalize">{fb.reviewerRole}</span>
                          <span className="text-gray-500">•</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            fb.action === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {fb.action}
                          </span>
                        </div>
                        <p className="text-gray-700">{fb.comments}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {reviewAction === 'approve' ? 'Final Comments (Optional)' : 'Reason for Rejection *'}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    reviewAction === 'approve' 
                      ? 'Add final notes or printing instructions...'
                      : 'Please explain what needs to be revised...'
                  }
                  required={reviewAction === 'reject'}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || (reviewAction === 'reject' && !comments.trim())}
                  className={`flex-1 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    reviewAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Submitting...' : reviewAction === 'approve' ? '✓ Final Approval' : 'Reject File'}
                </button>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedFile(null);
                    setComments('');
                  }}
                  disabled={submitting}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

