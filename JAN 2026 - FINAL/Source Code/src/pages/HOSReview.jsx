import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import {
  getUserRole,
  getHOSReviewFiles,
  getHOSAllFiles,
  hosApproveFile,
  hosRejectFile,
  getFileFeedback,
  getDepartmentById,
  getDepartmentFiles
} from '../services/firestoreService';
import Navbar from '../components/Navbar';
import ReviewFileCard from '../components/ReviewFileCard';
import PDFViewer from '../components/PDFViewer';
import HOSUserManagement from '../components/HOSUserManagement';
import FeedbackFileInput from '../components/FeedbackFileInput';
import {
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  MessageSquare,
  AlertCircle,
  Loader2,
  GraduationCap,
  Search,
  Building2,
  Users
} from 'lucide-react';
import { formatFileSize, formatDate } from '../utils/helpers';

export default function HOSReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [department, setDepartment] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    pendingReview: 0,
    approvedToday: 0,
    totalFiles: 0
  });
  const [selectedFileForView, setSelectedFileForView] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'pending'); // 'pending', 'revision', 'approved', 'team'
  const [userDeptId, setUserDeptId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allHOSFiles, setAllHOSFiles] = useState([]);
  const [feedbackAttachment, setFeedbackAttachment] = useState(null);

  useEffect(() => {
    checkAccessAndLoad();
  }, []);

  useEffect(() => {
    if (location.state?.tab && ['pending', 'revision', 'approved', 'team'].includes(location.state.tab)) {
      setActiveTab(location.state.tab);
    }
  }, [location.state?.tab]);

  const checkAccessAndLoad = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const role = await getUserRole(user.uid);
      if (role !== 'hos') {
        navigate('/dashboard');
        return;
      }

      await loadReviewFiles();
    } catch (err) {
      console.error('Error checking access:', err);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const loadReviewFiles = async () => {
    try {
      setLoading(true);
      const user = getCurrentUser();

      // Get user's department from users collection
      const { getAllUsers } = await import('../services/firestoreService');
      const allUsers = await getAllUsers();
      const currentUser = allUsers.find(u => u.id === user.uid);
      const deptId = currentUser?.department;
      setUserDeptId(deptId);

      console.log('HOS Review - Department ID:', deptId);

      if (!deptId) {
        setError('You are not assigned to any department. Please contact Exam Unit.');
        setLoading(false);
        return;
      }

      // Get all relevant files for HOS (pending, approved by HOS, rejected by HOS)
      const allFiles = await getHOSAllFiles(deptId);
      console.log('HOS Review - All Files:', allFiles);
      setAllHOSFiles(allFiles);

      // Get only pending review files for stats
      const reviewFiles = allFiles.filter(f => f.workflowStatus === 'PENDING_HOS_REVIEW');

      // Get all department files for stats
      const allDeptFiles = await getDepartmentFiles(deptId);

      // Get department info
      const dept = await getDepartmentById(deptId);
      setDepartment(dept);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const approvedToday = allDeptFiles.filter(file => {
        if (!file.hosApprovedAt) return false;
        const approvedDate = file.hosApprovedAt.toDate ? file.hosApprovedAt.toDate() : new Date(file.hosApprovedAt);
        approvedDate.setHours(0, 0, 0, 0);
        return approvedDate.getTime() === today.getTime();
      }).length;

      setStats({
        pendingReview: reviewFiles.length,
        approvedToday: approvedToday,
        totalFiles: allDeptFiles.length
      });
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load files: ' + err.message);
    } finally {
      setLoading(false);
    }
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
        await hosApproveFile(selectedFile.id, user.uid, user.displayName || user.email, comments);
        setSuccess('File approved and forwarded to Exam Unit!');
      } else {
        if (!comments.trim()) {
          setError('Please provide revision notes');
          return;
        }
        await hosRejectFile(selectedFile.id, user.uid, user.displayName || user.email, comments);
        setSuccess('Revision requested. Lecturer has been notified.');
      }

      setShowReviewModal(false);
      setSelectedFile(null);
      setComments('');
      await loadReviewFiles();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
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
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">HOS Review Dashboard</h1>
          </div>
          <p className="text-gray-600 mt-1">Review and approve exam papers for your department</p>
          {department && (
            <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              📚 {department.name}
            </div>
          )}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReview}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedToday}</p>
                <p className="text-sm text-gray-600">Approved Today</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
                <p className="text-sm text-gray-600">Total Files</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'pending'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Clock className="w-5 h-5" />
              Pending Review
              {allHOSFiles.filter(f => f.workflowStatus === 'PENDING_HOS_REVIEW').length > 0 && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                  {allHOSFiles.filter(f => f.workflowStatus === 'PENDING_HOS_REVIEW').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('revision')}
              className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'revision'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <XCircle className="w-5 h-5" />
              Needs Revision
              {allHOSFiles.filter(f => f.workflowStatus === 'NEEDS_REVISION').length > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                  {allHOSFiles.filter(f => f.workflowStatus === 'NEEDS_REVISION').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'approved'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <CheckCircle className="w-5 h-5" />
              Approved Files
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {allHOSFiles.filter(f => f.workflowStatus === 'PENDING_EXAM_UNIT' || f.workflowStatus === 'APPROVED').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'team'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Users className="w-5 h-5" />
              Team
            </button>
          </div>
        </div>

        {/* Team Management Tab */}
        {activeTab === 'team' && userDeptId && (
          <HOSUserManagement departmentId={userDeptId} onRefresh={loadReviewFiles} />
        )}

        {/* Search Bar - only show for file tabs */}
        {activeTab !== 'team' && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by file, subject, or lecturer name..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Files List - only show for file tabs */}
        {activeTab !== 'team' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeTab === 'pending' && 'Files Pending Review'}
                {activeTab === 'revision' && 'Files Needing Revision'}
                {activeTab === 'approved' && 'Approved Files'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {activeTab === 'pending' && 'Files submitted by lecturers awaiting your review'}
                {activeTab === 'revision' && 'Files that need revision from lecturers'}
                {activeTab === 'approved' && 'Files you approved - yellow for waiting Exam Unit, green for final approval'}
              </p>
            </div>

            {(() => {
              // Filter files based on active tab
              let filteredFiles = [];
              if (activeTab === 'pending') {
                filteredFiles = allHOSFiles.filter(f => f.workflowStatus === 'PENDING_HOS_REVIEW');
              } else if (activeTab === 'revision') {
                filteredFiles = allHOSFiles.filter(f => f.workflowStatus === 'NEEDS_REVISION');
              } else if (activeTab === 'approved') {
                filteredFiles = allHOSFiles.filter(f => f.workflowStatus === 'PENDING_EXAM_UNIT' || f.workflowStatus === 'APPROVED');
              }

              // Apply search filter
              if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                filteredFiles = filteredFiles.filter(file =>
                  file.fileName?.toLowerCase().includes(query) ||
                  file.subjectCode?.toLowerCase().includes(query) ||
                  file.subjectName?.toLowerCase().includes(query) ||
                  file.createdByName?.toLowerCase().includes(query)
                );
              }

              if (filteredFiles.length === 0) {
                return (
                  <div className="p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      {searchQuery ? 'No files match your search' :
                        activeTab === 'pending' ? 'No files pending review' :
                          activeTab === 'revision' ? 'No files needing revision' :
                            'No approved files yet'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {searchQuery ? 'Try adjusting your search query' :
                        activeTab === 'pending' ? 'Files submitted by lecturers will appear here' :
                          activeTab === 'revision' ? 'Files you request revision for will appear here' :
                            'Files you approve will appear here'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredFiles.map((file) => (
                      <ReviewFileCard
                        key={file.id}
                        file={file}
                        onViewPDF={(file) => setSelectedFileForView(file)}
                        onApprove={file.workflowStatus === 'PENDING_HOS_REVIEW' ? (file) => handleReview(file, 'approve') : undefined}
                        onReject={file.workflowStatus === 'PENDING_HOS_REVIEW' ? (file) => handleReview(file, 'reject') : undefined}
                        showComments={false}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {reviewAction === 'approve' ? 'Approve File' : 'Request Revision'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{selectedFile.fileName}</p>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Previous Feedback */}
              {feedback.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Previous Feedback
                  </h4>
                  <div className="space-y-2">
                    {feedback.map((fb, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{fb.reviewerName}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-500">{fb.reviewerRole}</span>
                          <span className="text-gray-500">•</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${fb.action === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
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
                  {reviewAction === 'approve' ? 'Comments (Optional)' : 'Revision Notes *'}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Add any notes or suggestions...'
                      : 'Please explain what needs to be revised...'
                  }
                  required={reviewAction === 'reject'}
                />
              </div>

              {/* Feedback File Attachment */}
              <div className="mb-6">
                <FeedbackFileInput
                  onFileChange={setFeedbackAttachment}
                  disabled={submitting}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || (reviewAction === 'reject' && !comments.trim())}
                  className={`flex-1 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${reviewAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                >
                  {submitting ? 'Submitting...' : reviewAction === 'approve' ? 'Approve & Forward' : 'Request Revision'}
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

      {/* PDF Viewer Modal */}
      {selectedFileForView && (
        <PDFViewer
          file={selectedFileForView}
          encryptionKey={selectedFileForView.encryptionKey}
          onClose={() => setSelectedFileForView(null)}
        />
      )}
    </div>
  );
}

