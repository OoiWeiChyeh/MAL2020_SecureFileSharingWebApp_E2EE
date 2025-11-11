import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';
import { 
  getPendingUsers, 
  getAllUsers,
  updateUserRole,
  getUserRole,
  getDepartments,
  createDepartment,
  deleteDepartment,
  assignHOSToDepartment,
  addCourseToDepartment,
  deleteCourse,
  addSubjectToCourse,
  deleteSubject,
  assignLecturerToSubject,
  unassignLecturerFromSubject,
} from '../services/firestoreService';
import Navbar from '../components/Navbar';
import { 
  Users, 
  Building2, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  XCircle,
  Plus,
  Trash2,
  UserCheck,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Search,
  ArrowLeft,
  Award,
  UserPlus
} from 'lucide-react';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending-users');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [expandedDepts, setExpandedDepts] = useState({});
  const [expandedCourses, setExpandedCourses] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Approval modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showCreateDeptInModal, setShowCreateDeptInModal] = useState(false);
  const [newDeptInModal, setNewDeptInModal] = useState({ name: '', code: '' });
  
  // Department/Course/Subject modals
  const [showAddDept, setShowAddDept] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [courseForm, setCourseForm] = useState({ courseName: '', courseCode: '' });
  const [subjectForm, setSubjectForm] = useState({ subjectName: '', subjectCode: '' });
  const [selectedDeptForCourse, setSelectedDeptForCourse] = useState(null);
  const [selectedCourseForSubject, setSelectedCourseForSubject] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
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
      setError('Failed to verify access');
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [pending, users, depts] = await Promise.all([
        getPendingUsers(),
        getAllUsers(),
        getDepartments()
      ]);
      
      setPendingUsers(pending);
      setAllUsers(users);
      setDepartments(depts);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApproval = (user, role) => {
    setSelectedUser(user);
    setSelectedRole(role);
    setSelectedDepartment('');
    setShowApprovalModal(true);
  };

  const handleCreateDeptInModal = async () => {
    if (!newDeptInModal.name.trim() || !newDeptInModal.code.trim()) {
      setError('Please provide department name and code');
      return;
    }

    try {
      setSubmitting(true);
      const deptId = await createDepartment(newDeptInModal);
      await loadData();
      setSelectedDepartment(deptId);
      setShowCreateDeptInModal(false);
      setNewDeptInModal({ name: '', code: '' });
      setSuccess('Department created!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error creating department:', err);
      setError('Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveUser = async () => {
    if (!selectedUser || !selectedRole) return;

    // Validate department selection for HOS and Lecturer
    if ((selectedRole === 'hos' || selectedRole === 'lecturer') && !selectedDepartment) {
      setError('Please select a department');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const updateData = { department: selectedDepartment };
      
      if (selectedRole === 'hos' && selectedDepartment) {
        // Assign HOS to department
        await assignHOSToDepartment(
          selectedDepartment,
          selectedUser.id,
          selectedUser.displayName || selectedUser.email
        );
      }

      await updateUserRole(selectedUser.id, selectedRole, updateData);
      
      setSuccess(`User approved as ${selectedRole}!`);
      setShowApprovalModal(false);
      setSelectedUser(null);
      setSelectedRole('');
      setSelectedDepartment('');
      await loadData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error approving user:', err);
      setError('Failed to approve user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectUser = async (userId) => {
    if (!confirm('Are you sure you want to reject this user?')) return;

    try {
      await updateUserRole(userId, 'rejected');
      setSuccess('User rejected');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to reject user');
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createDepartment(deptForm);
      setSuccess('Department created successfully');
      setShowAddDept(false);
      setDeptForm({ name: '', code: '' });
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!confirm('Are you sure you want to delete this department? This will remove all courses and subjects.')) return;
    try {
      await deleteDepartment(deptId);
      setSuccess('Department deleted');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete department');
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!selectedDeptForCourse) return;
    try {
      setSubmitting(true);
      await addCourseToDepartment(selectedDeptForCourse, courseForm);
      setSuccess('Course added successfully');
      setShowAddCourse(false);
      setCourseForm({ courseName: '', courseCode: '' });
      setSelectedDeptForCourse(null);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (deptId, courseId) => {
    if (!confirm('Delete this course and all its subjects?')) return;
    try {
      await deleteCourse(deptId, courseId);
      setSuccess('Course deleted');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete course');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!selectedDeptForCourse || !selectedCourseForSubject) return;
    try {
      setSubmitting(true);
      await addSubjectToCourse(selectedDeptForCourse, selectedCourseForSubject, subjectForm);
      setSuccess('Subject added successfully');
      setShowAddSubject(false);
      setSubjectForm({ subjectName: '', subjectCode: '' });
      setSelectedCourseForSubject(null);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignLecturer = async (deptId, courseId, subjectId, lecturerId) => {
    try {
      const lecturer = allUsers.find(u => u.id === lecturerId);
      await assignLecturerToSubject(deptId, courseId, subjectId, lecturerId, lecturer.displayName);
      setSuccess('Lecturer assigned successfully');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to assign lecturer');
    }
  };

  const handleUnassignLecturer = async (deptId, courseId, subjectId, lecturerId) => {
    try {
      await unassignLecturerFromSubject(deptId, courseId, subjectId, lecturerId);
      setSuccess('Lecturer unassigned');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to unassign lecturer');
    }
  };

  const toggleDept = (deptId) => {
    setExpandedDepts(prev => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  const lecturers = allUsers.filter(u => u.role === 'lecturer');
  const hosUsers = allUsers.filter(u => u.role === 'hos');

  const filteredPendingUsers = pendingUsers.filter(u =>
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllUsers = allUsers.filter(u =>
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exam Unit Admin Panel</h1>
              <p className="text-gray-600 mt-1">Manage users, departments, courses, and subjects</p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{pendingUsers.length}</div>
                <div className="text-xs text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{allUsers.length}</div>
                <div className="text-xs text-gray-600">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{departments.length}</div>
                <div className="text-xs text-gray-600">Departments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-800">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('pending-users');
                setSearchQuery('');
              }}
              className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'pending-users'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Pending Approvals
              {pendingUsers.length > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                  {pendingUsers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('all-users');
                setSearchQuery('');
              }}
              className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'all-users'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-5 h-5" />
              All Users ({allUsers.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('departments');
                setSearchQuery('');
              }}
              className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'departments'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Departments ({departments.length})
            </button>
          </div>

          <div className="p-6">
            {/* Search Bar */}
            {(activeTab === 'pending-users' || activeTab === 'all-users') && (
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Pending Users Tab */}
            {activeTab === 'pending-users' && (
              <div>
                {filteredPendingUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      {searchQuery ? 'No matching pending users' : 'No pending users'}
                    </p>
                    <p className="text-sm text-gray-500">New registrations will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPendingUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-white">
                              {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.displayName || 'Unknown'}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Registered: {user.createdAt?.toDate().toLocaleString() || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenApproval(user, 'lecturer')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Approve as Lecturer
                          </button>
                          <button
                            onClick={() => handleOpenApproval(user, 'hos')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Approve as HOS
                          </button>
                          <button
                            onClick={() => handleRejectUser(user.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* All Users Tab - ENHANCED */}
            {activeTab === 'all-users' && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {filteredAllUsers.length} of {allUsers.length} users
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subjects</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredAllUsers.map(user => {
                        const dept = departments.find(d => d.id === user.department);
                        const subjectCount = user.assignedSubjects?.length || 0;
                        
                        return (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-white">
                                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{user.displayName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.role === 'exam_unit' ? 'bg-purple-100 text-purple-700' :
                                user.role === 'hos' ? 'bg-green-100 text-green-700' :
                                user.role === 'lecturer' ? 'bg-blue-100 text-blue-700' :
                                user.role === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {user.role === 'exam_unit' ? '👑 Exam Unit' :
                                 user.role === 'hos' ? '🎓 HOS' :
                                 user.role === 'lecturer' ? '👨‍🏫 Lecturer' :
                                 user.role === 'pending' ? '⏳ Pending' :
                                 user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {dept ? dept.name : user.department || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {subjectCount > 0 ? (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {subjectCount} subject{subjectCount > 1 ? 's' : ''}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {user.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Departments Tab - CONTINUE FROM PREVIOUS */}
            {activeTab === 'departments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Department Management</h3>
                    <p className="text-sm text-gray-600 mt-1">Create and manage your academic structure</p>
                  </div>
                  <button
                    onClick={() => setShowAddDept(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Department
                  </button>
                </div>

                {/* Department cards will continue... */}
                {departments.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No departments created yet</p>
                    <p className="text-sm text-gray-500 mb-4">Create your first department to get started</p>
                    <button
                      onClick={() => setShowAddDept(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Department
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {departments.map(dept => (
                      <div key={dept.id} className="border-2 border-gray-200 rounded-lg bg-white hover:border-blue-300 transition-colors">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <button 
                                onClick={() => toggleDept(dept.id)}
                                className="p-1 hover:bg-white rounded transition-colors"
                              >
                                {expandedDepts[dept.id] ? (
                                  <ChevronDown className="w-5 h-5 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-gray-600" />
                                )}
                              </button>
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 text-lg">{dept.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <p className="text-sm text-gray-600">Code: {dept.code}</p>
                                  {dept.hosName && (
                                    <>
                                      <span className="text-gray-400">•</span>
                                      <p className="text-sm text-green-600 font-medium">
                                        HOS: {dept.hosName}
                                      </p>
                                    </>
                                  )}
                                  <span className="text-gray-400">•</span>
                                  <p className="text-sm text-gray-600">
                                    {dept.courses?.length || 0} course{dept.courses?.length !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {!dept.hosId && hosUsers.length > 0 && (
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      const hos = hosUsers.find(h => h.id === e.target.value);
                                      assignHOSToDepartment(dept.id, e.target.value, hos.displayName)
                                        .then(() => {
                                          setSuccess('HOS assigned');
                                          loadData();
                                          setTimeout(() => setSuccess(''), 2000);
                                        })
                                        .catch(() => setError('Failed to assign HOS'));
                                    }
                                  }}
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50"
                                >
                                  <option value="">Assign HOS</option>
                                  {hosUsers.map(hos => (
                                    <option key={hos.id} value={hos.id}>{hos.displayName}</option>
                                  ))}
                                </select>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedDeptForCourse(dept.id);
                                  setShowAddCourse(true);
                                }}
                                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                              >
                                + Course
                              </button>
                              <button
                                onClick={() => handleDeleteDepartment(dept.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Courses - Expanded */}
                        {expandedDepts[dept.id] && dept.courses && dept.courses.length > 0 && (
                          <div className="p-4 bg-gray-50 space-y-3">
                            {dept.courses.map(course => (
                              <div key={course.courseId} className="border border-gray-200 rounded-lg bg-white">
                                <div className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      <button onClick={() => toggleCourse(course.courseId)}>
                                        {expandedCourses[course.courseId] ? (
                                          <ChevronDown className="w-4 h-4 text-gray-600" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-gray-600" />
                                        )}
                                      </button>
                                      <BookOpen className="w-4 h-4 text-blue-600" />
                                      <div>
                                        <p className="font-medium text-gray-900">{course.courseName}</p>
                                        <p className="text-xs text-gray-600">
                                          {course.courseCode} • {course.subjects?.length || 0} subject{course.subjects?.length !== 1 ? 's' : ''}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          setSelectedDeptForCourse(dept.id);
                                          setSelectedCourseForSubject(course.courseId);
                                          setShowAddSubject(true);
                                        }}
                                        className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-medium"
                                      >
                                        + Subject
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCourse(dept.id, course.courseId)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Subjects */}
                                {expandedCourses[course.courseId] && course.subjects && course.subjects.length > 0 && (
                                  <div className="px-3 pb-3 space-y-2">
                                    {course.subjects.map(subject => (
                                      <div key={subject.subjectId} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-gray-600" />
                                          <div>
                                            <p className="text-sm font-medium text-gray-900">{subject.subjectName}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <p className="text-xs text-gray-600">{subject.subjectCode}</p>
                                              {subject.assignedLecturerName && (
                                                <>
                                                  <span className="text-gray-400">•</span>
                                                  <p className="text-xs text-blue-600">👨‍🏫 {subject.assignedLecturerName}</p>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          {subject.assignedLecturerId ? (
                                            <button
                                              onClick={() => handleUnassignLecturer(dept.id, course.courseId, subject.subjectId, subject.assignedLecturerId)}
                                              className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs"
                                            >
                                              Unassign
                                            </button>
                                          ) : (
                                            <select
                                              onChange={(e) => e.target.value && handleAssignLecturer(dept.id, course.courseId, subject.subjectId, e.target.value)}
                                              className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                                              value=""
                                            >
                                              <option value="">Assign Lecturer</option>
                                              {lecturers.map(lect => (
                                                <option key={lect.id} value={lect.id}>{lect.displayName}</option>
                                              ))}
                                            </select>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Approve User as {selectedRole === 'hos' ? 'HOS' : 'Lecturer'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{selectedUser.displayName} ({selectedUser.email})</p>
            </div>

            <div className="p-6">
              {/* Select Department */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Department *
                </label>
                {showCreateDeptInModal ? (
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Department Name (e.g., Computer Science)"
                      value={newDeptInModal.name}
                      onChange={(e) => setNewDeptInModal({...newDeptInModal, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Department Code (e.g., CS)"
                      value={newDeptInModal.code}
                      onChange={(e) => setNewDeptInModal({...newDeptInModal, code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateDeptInModal}
                        disabled={submitting}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submitting ? 'Creating...' : 'Create Department'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateDeptInModal(false);
                          setNewDeptInModal({ name: '', code: '' });
                        }}
                        disabled={submitting}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Choose department...</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowCreateDeptInModal(true)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Create new department
                    </button>
                  </>
                )}
              </div>

              {selectedRole === 'hos' && selectedDepartment && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <p className="text-sm text-yellow-800">
                    ℹ️ This user will be assigned as Head of School for the selected department
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleApproveUser}
                disabled={!selectedDepartment || submitting}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Approving...' : `Approve as ${selectedRole === 'hos' ? 'HOS' : 'Lecturer'}`}
              </button>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedUser(null);
                  setSelectedRole('');
                  setSelectedDepartment('');
                  setShowCreateDeptInModal(false);
                }}
                disabled={submitting}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Department</h3>
            </div>
            <form onSubmit={handleCreateDepartment}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CS"
                    required
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Department'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDept(false);
                    setDeptForm({ name: '', code: '' });
                  }}
                  disabled={submitting}
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Course</h3>
            </div>
            <form onSubmit={handleAddCourse}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    value={courseForm.courseName}
                    onChange={(e) => setCourseForm({ ...courseForm, courseName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Bachelor of Computer Science"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    value={courseForm.courseCode}
                    onChange={(e) => setCourseForm({ ...courseForm, courseCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., BCS"
                    required
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Course'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCourse(false);
                    setCourseForm({ courseName: '', courseCode: '' });
                    setSelectedDeptForCourse(null);
                  }}
                  disabled={submitting}
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Subject</h3>
            </div>
            <form onSubmit={handleAddSubject}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={subjectForm.subjectName}
                    onChange={(e) => setSubjectForm({ ...subjectForm, subjectName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Database Systems"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    value={subjectForm.subjectCode}
                    onChange={(e) => setSubjectForm({ ...subjectForm, subjectCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CS301"
                    required
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Subject'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubject(false);
                    setSubjectForm({ subjectName: '', subjectCode: '' });
                    setSelectedCourseForSubject(null);
                  }}
                  disabled={submitting}
                  className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
