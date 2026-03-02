import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { 
  getUserRole, 
  getExamUnitReviewFiles, 
  examUnitApproveFile, 
  examUnitRejectFile,
  getFileFeedback,
  getDepartments,
  getAllFiles
} from '../services/firestoreService';
import Navbar from '../components/Navbar';
import FileCard from '../components/FileCard';
import { 
  CheckCircle, 
  XCircle, 
  FileText,
  MessageSquare,
  AlertCircle,
  Loader2,
  Award,
  Building2,
  ChevronDown,
  ChevronUp,
  Search,
  Clock
} from 'lucide-react';
import { formatFileSize, formatDate } from '../utils/helpers';

export default function ExamUnitReview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedDepts, setCollapsedDepts] = useState({});
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'approved'
  const [stats, setStats] = useState({
    pending: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalApproved: 0,
    departments: 0
  });

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
      const [reviewFiles, depts, allFilesData] = await Promise.all([
        getExamUnitReviewFiles(),
        getDepartments(),
        getAllFiles()
      ]);
      
      setFiles(reviewFiles);
      setDepartments(depts);
      setAllFiles(allFilesData);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const approvedToday = allFilesData.filter(file => {
        if (!file.examUnitApprovedAt) return false;
        const approvedDate = file.examUnitApprovedAt.toDate ? 
          file.examUnitApprovedAt.toDate() : new Date(file.examUnitApprovedAt);
        approvedDate.setHours(0, 0, 0, 0);
        return approvedDate.getTime() === today.getTime();
      }).length;

      const rejectedToday = allFilesData.filter(file => {
        if (!file.examUnitRejectedAt) return false;
        const rejectedDate = file.examUnitRejectedAt.toDate ? 
          file.examUnitRejectedAt.toDate() : new Date(file.examUnitRejectedAt);
        rejectedDate.setHours(0, 0, 0, 0);
        return rejectedDate.getTime() === today.getTime();
      }).length;

      const totalApproved = allFilesData.filter(file => 
        file.workflowStatus === 'APPROVED'
      ).length;

      setStats({
        pending: reviewFiles.length,
        approvedToday: approvedToday,
        rejectedToday: rejectedToday,
        totalApproved: totalApproved,
        departments: depts.length
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load files');
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
        await examUnitApproveFile(selectedFile.id, user.uid, user.displayName || user.email, comments);
        setSuccess('File approved! Ready for printing.');
      } else {
        if (!comments.trim()) {
          setError('Please provide revision notes');
          return;
        }
        await examUnitRejectFile(selectedFile.id, user.uid, user.displayName || user.email, comments);
        setSuccess('Revision requested. Lecturer has been notified.');
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

  // Group files by department
  const groupByDepartment = (filesList) => {
    const grouped = {};
    filesList.forEach(file => {
      const deptName = file.departmentName || 'Unknown Department';
      if (!grouped[deptName]) {
        grouped[deptName] = [];
      }
      grouped[deptName].push(file);
    });
    return grouped;
  };

  // Filter files by search query
  const filterFiles = (filesList) => {
    if (!searchQuery.trim()) return filesList;
    
    const query = searchQuery.toLowerCase();
    return filesList.filter(file => 
      file.fileName?.toLowerCase().includes(query) ||
      file.subjectCode?.toLowerCase().includes(query) ||
      file.subjectName?.toLowerCase().includes(query) ||
      file.departmentName?.toLowerCase().includes(query) ||
      file.createdByName?.toLowerCase().includes(query)
    );
  };

  // Toggle department collapse
  const toggleDepartment = (deptName) => {
    setCollapsedDepts(prev => ({
      ...prev,
      [deptName]: !prev[deptName]
    }));
  };

  // Get approved files
  const approvedFiles = allFiles.filter(file => file.workflowStatus === 'APPROVED');
  
  // Filter files based on active tab
  const currentFiles = activeTab === 'pending' ? files : approvedFiles;
  const filteredFiles = filterFiles(currentFiles);
  const groupedFiles = groupByDepartment(filteredFiles);

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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApproved}</p>
                <p className="text-sm text-gray-600">Total Approved</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedToday}</p>
                <p className="text-sm text-gray-600">Approved Today</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.rejectedToday}</p>
                <p className="text-sm text-gray-600">Revisions Today</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.departments}</p>
                <p className="text-sm text-gray-600">Departments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-5 h-5" />
              Pending Review
              {stats.pending > 0 && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                  {stats.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'approved'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              Approved Files
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                {stats.totalApproved}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file, subject, department, or lecturer name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Files List - Grouped by Department */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {activeTab === 'pending' ? 'Files Awaiting Final Approval' : 'Approved Files'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {activeTab === 'pending' 
                ? 'HOS-approved files grouped by department' 
                : 'All files that have completed final approval'}
            </p>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="p-12 text-center">
              {activeTab === 'pending' ? (
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              ) : (
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              )}
              <p className="text-gray-600 mb-2">
                {searchQuery ? 'No files match your search' : 
                  activeTab === 'pending' ? 'No files pending final review' : 'No approved files yet'}
              </p>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search query' : 
                  activeTab === 'pending' ? 'HOS-approved files will appear here' : 'Approved files will appear here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {Object.entries(groupedFiles).map(([deptName, deptFiles]) => (
                <div key={deptName} className="overflow-hidden">
                  {/* Department Header - Collapsible */}
                  <button
                    onClick={() => toggleDepartment(deptName)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{deptName}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {deptFiles.length} file{deptFiles.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {collapsedDepts[deptName] ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Department Files */}
                  {!collapsedDepts[deptName] && (
                    <div className="px-6 pb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {deptFiles.map((file) => (
                          <div key={file.id} className="space-y-3">
                            <FileCard 
                              file={file} 
                              isOwner={false}
                              userRole="exam_unit"
                              onDeleted={loadData}
                            />
                            
                            {/* Lecturer Info */}
                            {file.createdByName && (
                              <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600">
                                  <span className="font-medium">Lecturer:</span> {file.createdByName}
                                </p>
                              </div>
                            )}

                            {/* HOS Comments */}
                            {file.hosComments && (
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs font-medium text-blue-900 mb-1">HOS Comments:</p>
                                <p className="text-sm text-blue-800">{file.hosComments}</p>
                              </div>
                            )}

                            {/* Exam Unit Comments (for approved files) */}
                            {activeTab === 'approved' && file.examUnitComments && (
                              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-xs font-medium text-green-900 mb-1">Exam Unit Comments:</p>
                                <p className="text-sm text-green-800">{file.examUnitComments}</p>
                              </div>
                            )}

                            {/* Approval Info (for approved files) */}
                            {activeTab === 'approved' && file.examUnitApprovedAt && (
                              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                <p className="text-xs font-medium text-emerald-900 mb-1">✓ Approved</p>
                                <p className="text-xs text-emerald-800">
                                  By {file.examUnitApprovedByName || 'Exam Unit'} on {formatDate(file.examUnitApprovedAt)}
                                </p>
                              </div>
                            )}

                            {/* Action Buttons (only for pending tab) */}
                            {activeTab === 'pending' && (
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
                                  className="flex-1 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Request Revision
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
                {reviewAction === 'approve' ? 'Final Approval' : 'Request Revision'}
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
                  {reviewAction === 'approve' ? 'Final Comments (Optional)' : 'Revision Notes *'}
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
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {submitting ? 'Submitting...' : reviewAction === 'approve' ? '✓ Final Approval' : 'Request Revision'}
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

