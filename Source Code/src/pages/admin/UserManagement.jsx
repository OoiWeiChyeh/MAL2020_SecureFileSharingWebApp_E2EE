import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Users, UserCheck, Clock, Loader2 } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';
import { 
  getUserProfile, 
  isExamUnit, 
  getPendingUsers, 
  getAllUsers,
  updateUserRole,
  USER_ROLES 
} from '../../services/roleService';
import { notifyUserAboutRoleAssignment } from '../../services/notificationService';
import Navbar from '../../components/Navbar';

export default function UserManagement() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all'
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const profile = await getUserProfile(user.uid);
    if (!profile || !isExamUnit(profile)) {
      navigate('/dashboard');
      return;
    }

    setUserProfile(profile);
    await loadUsers();
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const [pending, all] = await Promise.all([
        getPendingUsers(),
        getAllUsers()
      ]);
      setPendingUsers(pending);
      setAllUsers(all);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleApproveUser = async (userId, role) => {
    setProcessing(userId);
    try {
      await updateUserRole(userId, role);
      await notifyUserAboutRoleAssignment(userId, role);
      await loadUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectUser = async (userId) => {
    if (!confirm('Are you sure you want to reject this user?')) return;
    
    setProcessing(userId);
    try {
      // For now, we'll just keep them as pending
      // In production, you might want to delete or mark as rejected
      alert('User rejection feature coming soon');
    } catch (error) {
      console.error('Error rejecting user:', error);
    } finally {
      setProcessing(null);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case USER_ROLES.EXAM_UNIT:
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case USER_ROLES.HOS:
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case USER_ROLES.LECTURER:
        return 'bg-green-100 text-green-700 border-green-300';
      case USER_ROLES.PENDING:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Admin Panel
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          </div>
          <p className="text-gray-600">Approve pending users and manage roles</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Approved Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allUsers.filter(u => u.role !== USER_ROLES.PENDING).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{allUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending Approval ({pendingUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Users ({allUsers.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No pending users</p>
                  </div>
                ) : (
                  pendingUsers.map(user => (
                    <div
                      key={user.id}
                      className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            Registered: {user.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          id={`role-${user.id}`}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          defaultValue=""
                        >
                          <option value="" disabled>Select Role</option>
                          <option value={USER_ROLES.LECTURER}>Lecturer</option>
                          <option value={USER_ROLES.HOS}>Head of School</option>
                          <option value={USER_ROLES.EXAM_UNIT}>Exam Unit</option>
                        </select>
                        <button
                          onClick={() => {
                            const role = document.getElementById(`role-${user.id}`).value;
                            if (!role) {
                              alert('Please select a role');
                              return;
                            }
                            handleApproveUser(user.id, role);
                          }}
                          disabled={processing === user.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
                        >
                          {processing === user.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectUser(user.id)}
                          disabled={processing === user.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'all' && (
              <div className="space-y-4">
                {allUsers.map(user => (
                  <div
                    key={user.id}
                    className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
                        {user.role?.replace('_', ' ').toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

