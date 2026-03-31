import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getUserFiles,
  getUserRole,
  getPendingUsers,
  getHOSReviewFiles,
  getExamUnitReviewFiles,
  getLecturerAssignedSubjects,
  getDepartments,
  getAllFiles,
  getSubjectDeadlines
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
  Shield,
  GraduationCap,
  User,
  LayoutDashboard
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
  const [subjectDeadlineMap, setSubjectDeadlineMap] = useState({});

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

      // Get departments for deadline resolution
      const depts = await getDepartments();

      // Compute effective deadlines for each subject
      const deadlineMap = getSubjectDeadlines(subjects, depts);
      setSubjectDeadlineMap(deadlineMap);

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
        file.subjectCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.departmentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.createdByName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || file.workflowStatus === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  const filteredMyFiles = filterFiles(myFiles);
  const filteredReviewFiles = filterFiles(reviewFiles);

  // Group files by department for Exam Unit
  const groupFilesByDepartment = (files) => {
    const grouped = {};
    files.forEach(file => {
      const deptName = file.departmentName || 'Unknown Department';
      if (!grouped[deptName]) {
        grouped[deptName] = [];
      }
      grouped[deptName].push(file);
    });
    return grouped;
  };

  // Group files by status for better organization
  const groupFilesByStatus = (files) => {
    const grouped = {
      'PENDING_EXAM_UNIT': [],
      'PENDING_HOS_REVIEW': [],
      'APPROVED': [],
      'DRAFT': [],
      'NEEDS_REVISION': []
    };
    files.forEach(file => {
      const status = file.workflowStatus || 'DRAFT';
      if (grouped[status]) {
        grouped[status].push(file);
      } else {
        grouped['DRAFT'].push(file);
      }
    });
    return grouped;
  };

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
            <div className="flex items-center gap-3">
              {userRole === 'exam_unit' && <Shield className="w-8 h-8 text-purple-600" />}
              {userRole === 'hos' && <GraduationCap className="w-8 h-8 text-green-600" />}
              {userRole === 'lecturer' && <User className="w-8 h-8 text-blue-600" />}
              {!userRole && <LayoutDashboard className="w-8 h-8 text-gray-600" />}
              <h1 className="text-3xl font-bold text-gray-900">
                {userRole === 'exam_unit' && 'Exam Unit Dashboard'}
                {userRole === 'hos' && 'Head of School Dashboard'}
                {userRole === 'lecturer' && 'Lecturer Dashboard'}
                {!userRole && 'Dashboard'}
              </h1>
            </div>
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
        <div className={`grid grid-cols-1 md:grid-cols-2 ${userRole === 'lecturer' ? 'lg:grid-cols-4' : userRole === 'hos' ? 'lg:grid-cols-4' : 'lg:grid-cols-4'} gap-4 mb-4`}>
          {/* Total Files */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">Total Files</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</p>
            <p className="text-xs text-gray-600">Files in system</p>
            {stats.total > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-300">
                <div className="flex items-center gap-2 text-xs font-medium text-blue-800">
                  <TrendingUp className="w-3 h-3" />
                  <span>Active files</span>
                </div>
              </div>
            )}
          </div>

          {/* Status Cards based on role */}
          {userRole === 'lecturer' && (
            <>
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">Draft</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stats.draft}</p>
                <p className="text-xs text-gray-600">Work in progress</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-sm border border-yellow-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-yellow-700 uppercase tracking-wider">Under Review</p>
                </div>
                <p className="text-3xl font-bold text-yellow-900 mb-1">{stats.pendingReview}</p>
                <p className="text-xs text-yellow-800">Being reviewed</p>
                {stats.pendingReview > 0 && (
                  <div className="mt-3 pt-3 border-t border-yellow-300">
                    <div className="flex items-center gap-2 text-xs font-semibold text-yellow-900">
                      <AlertCircle className="w-3 h-3" />
                      <span>Action required</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">Approved</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stats.approved}</p>
                <p className="text-xs text-green-800">Ready to print</p>
              </div>
            </>
          )}

          {/* HOS Status Cards */}
          {userRole === 'hos' && (
            <>
              <div
                onClick={() => navigate('/hos-review')}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-sm border border-yellow-200 p-4 hover:shadow-md transition-shadow cursor-pointer relative"
              >
                {stats.awaitingReview > 0 && (
                  <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                    <span className="text-[9px] font-bold text-white leading-none">{stats.awaitingReview}</span>
                  </span>
                )}
                <div className="flex items-start justify-between mb-3 pr-8">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-yellow-700 uppercase tracking-wider">Files to Review</p>
                </div>
                <p className="text-3xl font-bold text-yellow-900 mb-1">{stats.awaitingReview || 0}</p>
                <p className="text-xs text-yellow-800">Click to review</p>
                {stats.awaitingReview > 0 && (
                  <div className="mt-3 pt-3 border-t border-yellow-300">
                    <div className="flex items-center gap-1 text-xs font-semibold text-yellow-900">
                      <span>Click to review</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">Approved</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stats.approved}</p>
                <p className="text-xs text-green-800">Ready to print</p>
              </div>

              <div
                onClick={() => navigate('/hos-review', { state: { tab: 'revision' } })}
                className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-sm border border-red-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">Needs Revision</p>
                </div>
                <p className="text-3xl font-bold text-red-900 mb-1">{stats.needsRevision || 0}</p>
                <p className="text-xs text-red-800">Revision requested</p>
                {(stats.needsRevision || 0) > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-300">
                    <div className="flex items-center gap-1 text-xs font-semibold text-red-900">
                      <span>Click to view</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Exam Unit Specific Cards */}
          {userRole === 'exam_unit' && (
            <>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">Approved</p>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stats.approved}</p>
                <p className="text-xs text-green-800">Ready to print</p>
              </div>

              <div
                onClick={() => navigate('/exam-review')}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-sm border border-yellow-200 p-4 hover:shadow-md transition-shadow cursor-pointer relative"
              >
                {stats.awaitingReview > 0 && (
                  <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                    <span className="text-[9px] font-bold text-white leading-none">{stats.awaitingReview}</span>
                  </span>
                )}
                <div className="flex items-start justify-between mb-3 pr-8">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-yellow-700 uppercase tracking-wider">Files to Review</p>
                </div>
                <p className="text-3xl font-bold text-yellow-900 mb-1">{stats.awaitingReview || 0}</p>
                <p className="text-xs text-yellow-800">Click to review</p>
                {stats.awaitingReview > 0 && (
                  <div className="mt-3 pt-3 border-t border-yellow-300">
                    <div className="flex items-center gap-1 text-xs font-semibold text-yellow-900">
                      <span>Click to review</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </div>

              <div
                onClick={() => navigate('/admin')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-all relative"
              >
                {pendingCount > 0 && (
                  <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                    <span className="text-[9px] font-bold text-white leading-none">{pendingCount}</span>
                  </span>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-purple-800 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right pr-8">
                    <p className="text-[10px] font-semibold text-white uppercase tracking-wider">User Approvals</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{pendingCount}</p>
                <p className="text-xs text-white/90">Manage users</p>
                <div className="mt-3 pt-3 border-t border-white/30">
                  <div className="flex items-center gap-1 text-xs font-semibold text-white">
                    <span>Click to manage</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Lecturer: Assigned Subjects */}
        {userRole === 'lecturer' && assignedSubjects.length > 0 && (
          <div className="bg-white rounded-xl p-5 mb-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-semibold text-gray-900">Your Assigned Subjects</h2>
            </div>
            <div className="space-y-3">
              {assignedSubjects.map(subject => {
                const dl = subjectDeadlineMap[subject.subjectId];
                const deadlineBg = dl
                  ? dl.status === 'overdue' ? 'bg-red-50 border-red-200'
                    : dl.status === 'critical' ? 'bg-red-50 border-red-200'
                      : dl.status === 'warning' ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200';

                return (
                  <div key={subject.subjectId} className="flex items-stretch border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
                    {/* Left: Subject Info */}
                    <div className="flex-1 p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{subject.subjectCode}</p>
                        <p className="text-sm text-gray-600">{subject.subjectName}</p>
                        {subject.deptName && (
                          <p className="text-xs text-gray-400 mt-0.5">{subject.deptName}</p>
                        )}
                      </div>
                    </div>

                    {/* Right: Deadline Countdown */}
                    <div className={`w-44 flex flex-col items-center justify-center p-4 border-l ${deadlineBg}`}>
                      {dl ? (
                        <>
                          <span className={`text-3xl font-bold ${dl.status === 'overdue' ? 'text-red-600' :
                              dl.status === 'critical' ? 'text-red-600' :
                                dl.status === 'warning' ? 'text-yellow-600' :
                                  'text-green-600'
                            }`}>
                            {dl.status === 'overdue' ? Math.abs(dl.daysLeft) : dl.daysLeft}
                          </span>
                          <span className={`text-xs font-semibold uppercase tracking-wide mt-0.5 ${dl.status === 'overdue' ? 'text-red-500' :
                              dl.status === 'critical' ? 'text-red-500' :
                                dl.status === 'warning' ? 'text-yellow-500' :
                                  'text-green-500'
                            }`}>
                            {dl.status === 'overdue' ? 'days overdue' :
                              dl.daysLeft === 0 ? 'Due today!' :
                                dl.daysLeft === 1 ? 'day left' : 'days left'}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-1">
                            {dl.deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-400 text-lg">—</span>
                          <span className="text-xs text-gray-400 mt-1">No deadline</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
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
              placeholder="Search by file, subject, department, or lecturer..."
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
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === 'all'
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
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat.value
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
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedStatus === 'all'
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
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedStatus === key
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
                className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === 'my-files'
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
                className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === 'review'
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
                className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === 'all-files'
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
                ) : userRole === 'exam_unit' ? (
                  // Exam Unit: Group by department
                  <div className="space-y-8">
                    {Object.entries(groupFilesByDepartment(filteredReviewFiles)).map(([deptName, deptFiles]) => (
                      <div key={deptName}>
                        {/* Department Header */}
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-200 bg-blue-50 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">{deptName}</h3>
                          <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
                            {deptFiles.length} pending
                          </span>
                        </div>

                        {/* Files Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                          {deptFiles.map(file => (
                            <FileCard
                              key={file.id}
                              file={file}
                              isOwner={currentUser && file.createdBy === currentUser.uid}
                              userRole={userRole}
                              onDeleted={handleFileDeleted}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // HOS: Standard grid
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
                  <div className="space-y-8">
                    {Object.entries(groupFilesByDepartment(filteredMyFiles)).map(([deptName, deptFiles]) => (
                      <div key={deptName}>
                        {/* Department Header */}
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">{deptName}</h3>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {deptFiles.length} file{deptFiles.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Files Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {deptFiles.map(file => (
                            <FileCard
                              key={file.id}
                              file={file}
                              isOwner={false}
                              userRole={userRole}
                              onDeleted={handleFileDeleted}
                            />
                          ))}
                        </div>
                      </div>
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
