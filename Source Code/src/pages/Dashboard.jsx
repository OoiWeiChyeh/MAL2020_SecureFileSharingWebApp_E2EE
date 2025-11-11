import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getUserFiles, 
  getSharedFiles, 
  getUserRole, 
  getPendingUsers,
  getHOSReviewFiles,
  getExamUnitReviewFiles,
  getLecturerAssignedSubjects,
  getDepartments,
  getAllFiles
} from '../services/firestoreService';
import { getCurrentUser } from '../services/authService';
import Navbar from '../components/Navbar';
import FileCard from '../components/FileCard';
import { 
  Upload, 
  FolderOpen, 
  Share2, 
  Loader2, 
  Search, 
  Filter, 
  X, 
  QrCode,
  FileCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Building2,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award,
  Shield
} from 'lucide-react';

const CATEGORIES = [
  { value: 'question-paper', label: '📄 Question Paper', color: 'blue' },
  { value: 'answer-key', label: '✓ Answer Key', color: 'green' },
  { value: 'rubric', label: '📋 Rubric', color: 'purple' },
  { value: 'marking-scheme', label: '🎯 Marking Scheme', color: 'orange' },
  { value: 'model-answer', label: '⭐ Model Answer', color: 'yellow' },
  { value: 'other', label: '📎 Other', color: 'gray' }
];

const WORKFLOW_STATUS = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Clock },
  PENDING_HOS_REVIEW: { label: 'Pending HOS Review', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  NEEDS_REVISION: { label: 'Needs Revision', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  PENDING_EXAM_UNIT: { label: 'Pending Exam Unit', color: 'bg-blue-100 text-blue-700', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [myFiles, setMyFiles] = useState([]);
  const [reviewFiles, setReviewFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-files'); // Will be updated based on role
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Role-specific data
  const [userRole, setUserRole] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [userDepartment, setUserDepartment] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pendingReview: 0,
    needsRevision: 0,
    approved: 0,
    totalDownloads: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const [currentUser, setCurrentUser] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const user = getCurrentUser();

      if (!user) {
        navigate('/login');
        return;
      }

      setCurrentUser(user);

      // Get user role
      const role = await getUserRole(user.uid);
      setUserRole(role);

      // Set default tab based on role
      if (role === 'hos' || role === 'exam_unit') {
        setActiveTab('review'); // HOS and Exam Unit should see review tab by default
      } else {
        setActiveTab('my-files'); // Lecturers see their files
      }

      // Load data based on role
      if (role === 'exam_unit') {
        await loadExamUnitData(user);
      } else if (role === 'hos') {
        await loadHOSData(user);
      } else if (role === 'lecturer') {
        await loadLecturerData(user);
      } else {
        // Default file loading
        await loadBasicFiles(user);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadExamUnitData = async (user) => {
    try {
      // Get pending users
      const pending = await getPendingUsers();
      setPendingCount(pending.length);

      // Get files pending exam unit review
      const reviewFiles = await getExamUnitReviewFiles();
      setReviewFiles(reviewFiles);

      // Get ALL files in the system (for "All Files" tab)
      const allFiles = await getAllFiles();
      setMyFiles(allFiles);

      // Calculate stats from all files
      calculateStats(allFiles, reviewFiles);
    } catch (err) {
      console.error('Error loading exam unit data:', err);
    }
  };

  const loadHOSData = async (user) => {
    try {
      // Get user's department
      const allUsers = await import('../services/firestoreService').then(m => m.getAllUsers());
      const currentUser = allUsers.find(u => u.id === user.uid);
      const deptId = currentUser?.department;

      console.log('HOS Dashboard - Department ID:', deptId);

      let allDeptFiles = [];
      let reviewFiles = [];

      if (deptId) {
        const depts = await getDepartments();
        const dept = depts.find(d => d.id === deptId);
        setUserDepartment(dept);
        console.log('HOS Dashboard - Department:', dept);

        // Get ALL files in the department (for stats)
        const { getDepartmentFiles } = await import('../services/firestoreService');
        allDeptFiles = await getDepartmentFiles(deptId);
        console.log('HOS Dashboard - All Department Files:', allDeptFiles);

        // Get files pending review
        reviewFiles = await getHOSReviewFiles(deptId);
        console.log('HOS Dashboard - Files Pending Review:', reviewFiles);
        setReviewFiles(reviewFiles);
      } else {
        console.warn('HOS Dashboard - No department assigned to HOS');
      }

      // Get user's own files
      const userFiles = await getUserFiles(user.uid);
      setMyFiles(userFiles);

      // Calculate stats from ALL department files (not just user's files)
      calculateStats(allDeptFiles.length > 0 ? allDeptFiles : userFiles, reviewFiles);
    } catch (err) {
      console.error('Error loading HOS data:', err);
    }
  };

  const loadLecturerData = async (user) => {
    try {
      // Get assigned subjects
      const subjects = await getLecturerAssignedSubjects(user.uid);
      setAssignedSubjects(subjects);

      // Get user's files
      const userFiles = await getUserFiles(user.uid);
      setMyFiles(userFiles);

      // Calculate stats
      calculateStats(userFiles, []);
    } catch (err) {
      console.error('Error loading lecturer data:', err);
    }
  };

  const loadBasicFiles = async (user) => {
    const userFiles = await getUserFiles(user.uid);
    setMyFiles(userFiles);

    calculateStats(userFiles, []);
  };

  const calculateStats = (files, reviewFiles = []) => {
    const draft = files.filter(f => f.workflowStatus === 'DRAFT').length;
    const pendingReview = files.filter(f => 
      f.workflowStatus === 'PENDING_HOS_REVIEW' || f.workflowStatus === 'PENDING_EXAM_UNIT'
    ).length;
    const needsRevision = files.filter(f => f.workflowStatus === 'NEEDS_REVISION').length;
    const approved = files.filter(f => f.workflowStatus === 'APPROVED').length;
    const totalDownloads = files.reduce((sum, f) => sum + (f.downloadCount || 0), 0);

    setStats({
      total: files.length,
      draft,
      pendingReview,
      needsRevision,
      approved,
      totalDownloads,
      awaitingReview: reviewFiles.length
    });
  };

  const handleFileDeleted = () => {
    loadDashboardData();
  };

  // Filter files
  const filterFiles = (files) => {
    return files.filter(file => {
      const matchesSearch = !searchQuery || 
        file.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.subjectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.subjectCode?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || file.workflowStatus === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  const filteredMyFiles = filterFiles(myFiles);
  const filteredReviewFiles = filterFiles(reviewFiles);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Role-Based Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {userRole === 'exam_unit' && '👑 Exam Unit Dashboard'}
              {userRole === 'hos' && '🎓 Head of School Dashboard'}
              {userRole === 'lecturer' && '👨‍🏫 Lecturer Dashboard'}
              {!userRole && 'Dashboard'}
            </h1>
            {/* Only lecturers can upload files */}
            {userRole === 'lecturer' && (
              <button
                onClick={() => navigate('/upload')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Upload className="w-4 h-4" />
                Upload New File
              </button>
            )}
          </div>
          <p className="text-gray-600">
            {userRole === 'exam_unit' && 'Manage exam papers, review submissions, and oversee the entire workflow'}
            {userRole === 'hos' && userDepartment && `Review and approve exam papers for ${userDepartment.name}`}
            {userRole === 'lecturer' && assignedSubjects.length > 0 && `Create and manage exam papers for ${assignedSubjects.map(s => s.subjectCode).join(', ')}`}
            {(!userRole || userRole === 'lecturer' && assignedSubjects.length === 0) && 'Manage your encrypted files securely'}
          </p>
        </div>

        {/* Role-Specific Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Files */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">Total Files</p>
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</p>
            <p className="text-xs text-gray-500">Files created</p>
          </div>

          {/* Status Cards based on role */}
          {(userRole === 'lecturer' || userRole === 'hos') && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600">Draft</p>
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stats.draft}</p>
                <p className="text-xs text-gray-500">Work in progress</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600">Under Review</p>
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-yellow-600 mb-1">{stats.pendingReview}</p>
                <p className="text-xs text-gray-500">Being reviewed</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600">Approved</p>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600 mb-1">{stats.approved}</p>
                <p className="text-xs text-gray-500">Ready to print</p>
              </div>
            </>
          )}

          {/* Exam Unit Specific Cards */}
          {userRole === 'exam_unit' && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600">Total Files</p>
                  <FolderOpen className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</p>
                <p className="text-xs text-gray-500">In system</p>
              </div>

              <div 
                onClick={() => navigate('/admin')}
                className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-sm p-6 cursor-pointer hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-purple-100">User Approvals</p>
                  <Users className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  {pendingCount}
                  {pendingCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                      NEW
                    </span>
                  )}
                </p>
                <p className="text-xs text-purple-100">Manage users</p>
              </div>

              <div 
                onClick={() => navigate('/exam-review')}
                className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-blue-100">Final Review</p>
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white mb-1">{stats.awaitingReview || 0}</p>
                <p className="text-xs text-blue-100">Files to approve</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600">Approved</p>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600 mb-1">{stats.approved}</p>
                <p className="text-xs text-gray-500">Ready to print</p>
              </div>
            </>
          )}

          {/* HOS Specific Cards */}
          {userRole === 'hos' && (
            <div 
              onClick={() => navigate('/hos-review')}
              className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-sm p-6 cursor-pointer hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-green-100">Files to Review</p>
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stats.awaitingReview || 0}</p>
              <p className="text-xs text-green-100">Click to review</p>
            </div>
          )}
        </div>

        {/* Lecturer: Assigned Subjects */}
        {userRole === 'lecturer' && assignedSubjects.length > 0 && (
          <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Your Assigned Subjects</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {assignedSubjects.map(subject => (
                <div key={subject.subjectId} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <span className="font-medium text-sm text-blue-900">{subject.subjectCode}</span>
                  <span className="text-xs text-gray-600">•</span>
                  <span className="text-sm text-gray-700">{subject.subjectName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HOS: Department Info */}
        {userRole === 'hos' && userDepartment && (
          <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600" />
              <h2 className="text-sm font-semibold text-gray-900">{userDepartment.name}</h2>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-600">{userDepartment.courses?.length || 0} course(s)</span>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files, subjects, codes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filter
            {(selectedCategory !== 'all' || selectedStatus !== 'all') && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {(selectedCategory !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/access')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            title="Access file via QR or link"
          >
            <QrCode className="w-4 h-4" />
            Access File
          </button>
        </div>

        {/* Filters */}
        {filterOpen && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 space-y-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">Filters</p>
              <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">📁 Category</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">📊 Workflow Status</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Status
                </button>
                {Object.entries(WORKFLOW_STATUS).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedStatus(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedStatus === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear All */}
            {(selectedCategory !== 'all' || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
                className="w-full px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {/* Show My Files tab only for Lecturers */}
            {userRole === 'lecturer' && (
              <button
                onClick={() => setActiveTab('my-files')}
                className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'my-files'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FolderOpen className="w-5 h-5" />
                My Files ({filteredMyFiles.length})
              </button>
            )}

            {/* Show Review tab for HOS and Exam Unit */}
            {(userRole === 'hos' || userRole === 'exam_unit') && (
              <button
                onClick={() => setActiveTab('review')}
                className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'review'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileCheck className="w-5 h-5" />
                {userRole === 'hos' ? 'Files to Review' : 'Final Review'} ({filteredReviewFiles.length})
                {filteredReviewFiles.length > 0 && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                    {filteredReviewFiles.length}
                  </span>
                )}
              </button>
            )}

            {/* Show All Files tab for Exam Unit */}
            {userRole === 'exam_unit' && (
              <button
                onClick={() => setActiveTab('all-files')}
                className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'all-files'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FolderOpen className="w-5 h-5" />
                All Files ({filteredMyFiles.length})
              </button>
            )}
          </div>

          {/* File Grid */}
          <div className="p-6">
            {activeTab === 'my-files' && (
              <>
                {filteredMyFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      {searchQuery || selectedCategory !== 'all' 
                        ? 'No files match your filters' 
                        : 'No files uploaded yet'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      {searchQuery || selectedCategory !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Upload your first encrypted file to get started'}
                    </p>
                    {!searchQuery && selectedCategory === 'all' && (
                      <button
                        onClick={() => navigate('/upload')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Upload File
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMyFiles.map(file => (
                      <FileCard 
                        key={file.id} 
                        file={file} 
                        isOwner={currentUser && file.createdBy === currentUser.uid}
                        userRole={userRole}
                        onDeleted={handleFileDeleted} 
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'review' && (
              <>
                {filteredReviewFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No files awaiting review</p>
                    <p className="text-sm text-gray-500">Files pending your approval will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReviewFiles.map(file => (
                      <FileCard 
                        key={file.id} 
                        file={file} 
                        isOwner={currentUser && file.createdBy === currentUser.uid}
                        userRole={userRole}
                        onDeleted={handleFileDeleted} 
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'all-files' && (
              <>
                {filteredMyFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No files in system</p>
                    <p className="text-sm text-gray-500">All files will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMyFiles.map(file => (
                      <FileCard 
                        key={file.id} 
                        file={file} 
                        isOwner={false}
                        userRole={userRole}
                        onDeleted={handleFileDeleted} 
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
