import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import {
    getPendingUsersForDepartment,
    getDepartmentLecturers,
    hosApproveUser,
    hosRejectUser,
    getDepartmentById,
    assignLecturerToSubject,
    unassignLecturerFromSubject
} from '../services/firestoreService';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';
import {
    UserPlus,
    Users,
    CheckCircle,
    XCircle,
    Loader2,
    Mail,
    Calendar,
    BookOpen,
    AlertCircle,
    Search
} from 'lucide-react';
import { formatDate } from '../utils/helpers';

/**
 * HOS User Management Component
 * Allows HOS to approve pending lecturers and manage department lecturers
 */
export default function HOSUserManagement({ departmentId, onRefresh }) {
    const toast = useToast();
    const [pendingUsers, setPendingUsers] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [department, setDepartment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [activeView, setActiveView] = useState('pending'); // 'pending' or 'lecturers'
    const [searchQuery, setSearchQuery] = useState('');

    // Rejection modal state
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectUser, setRejectUser] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    // Confirm approval modal
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveUser, setApproveUser] = useState(null);

    useEffect(() => {
        if (departmentId) {
            loadData();
        }
    }, [departmentId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [pending, deptLecturers, dept] = await Promise.all([
                getPendingUsersForDepartment(departmentId),
                getDepartmentLecturers(departmentId),
                getDepartmentById(departmentId)
            ]);
            setPendingUsers(pending);
            setLecturers(deptLecturers);
            setDepartment(dept);
        } catch (err) {
            console.error('Error loading HOS user data:', err);
            toast.error('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!approveUser) return;

        const user = getCurrentUser();
        try {
            setActionLoading(approveUser.id);
            await hosApproveUser(approveUser.id, departmentId, user.displayName || user.email);
            toast.success(`${approveUser.displayName || approveUser.email} approved as lecturer!`);
            setShowApproveModal(false);
            setApproveUser(null);
            await loadData();
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Error approving user:', err);
            toast.error('Failed to approve user');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!rejectUser) return;

        const user = getCurrentUser();
        try {
            setActionLoading(rejectUser.id);
            await hosRejectUser(rejectUser.id, user.displayName || user.email, rejectReason);
            toast.success(`${rejectUser.displayName || rejectUser.email} has been rejected`);
            setShowRejectModal(false);
            setRejectUser(null);
            setRejectReason('');
            await loadData();
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Error rejecting user:', err);
            toast.error('Failed to reject user');
        } finally {
            setActionLoading(null);
        }
    };

    const openApproveModal = (user) => {
        setApproveUser(user);
        setShowApproveModal(true);
    };

    const openRejectModal = (user) => {
        setRejectUser(user);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const filteredPending = pendingUsers.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredLecturers = lecturers.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Header with tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveView('pending')}
                    className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${activeView === 'pending'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <UserPlus className="w-5 h-5" />
                    Pending Approvals
                    {pendingUsers.length > 0 && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                            {pendingUsers.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveView('lecturers')}
                    className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${activeView === 'lecturers'
                            ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <Users className="w-5 h-5" />
                    Department Lecturers
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {lecturers.length}
                    </span>
                </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {activeView === 'pending' && (
                    <>
                        {filteredPending.length === 0 ? (
                            <div className="text-center py-12">
                                <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 mb-2">
                                    {searchQuery ? 'No users match your search' : 'No pending requests'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {searchQuery ? 'Try a different search term' : 'Users who register and request this department will appear here'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredPending.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{user.displayName || 'No Name'}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="w-4 h-4" />
                                                    {user.email}
                                                </div>
                                                {user.createdAt && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                        <Calendar className="w-3 h-3" />
                                                        Registered: {formatDate(user.createdAt)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openApproveModal(user)}
                                                disabled={actionLoading === user.id}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {actionLoading === user.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => openRejectModal(user)}
                                                disabled={actionLoading === user.id}
                                                className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeView === 'lecturers' && (
                    <>
                        {filteredLecturers.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 mb-2">
                                    {searchQuery ? 'No lecturers match your search' : 'No lecturers in department'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {searchQuery ? 'Try a different search term' : 'Approve pending users to add lecturers'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredLecturers.map((lecturer) => (
                                    <div
                                        key={lecturer.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                                {lecturer.displayName?.[0]?.toUpperCase() || lecturer.email?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{lecturer.displayName || 'No Name'}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="w-4 h-4" />
                                                    {lecturer.email}
                                                </div>
                                                {lecturer.assignedSubjects && lecturer.assignedSubjects.length > 0 && (
                                                    <div className="flex items-center gap-2 text-xs text-blue-600 mt-1">
                                                        <BookOpen className="w-3 h-3" />
                                                        {lecturer.assignedSubjects.length} subject{lecturer.assignedSubjects.length !== 1 ? 's' : ''} assigned
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {lecturer.approvedAt && (
                                                <p className="text-xs text-gray-500">
                                                    Approved: {formatDate(lecturer.approvedAt)}
                                                </p>
                                            )}
                                            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium mt-1">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Approve Confirmation Modal */}
            <ConfirmModal
                isOpen={showApproveModal}
                title="Approve User"
                message={`Are you sure you want to approve ${approveUser?.displayName || approveUser?.email} as a lecturer in ${department?.name || 'this department'}?`}
                confirmText="Approve"
                cancelText="Cancel"
                variant="warning"
                onConfirm={handleApprove}
                onCancel={() => {
                    setShowApproveModal(false);
                    setApproveUser(null);
                }}
                loading={actionLoading === approveUser?.id}
            />

            {/* Reject Modal with Reason */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-xl animate-scale-in">
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 rounded-full bg-red-100 text-red-600">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Reject User</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Reject {rejectUser?.displayName || rejectUser?.email}'s request?
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason (optional)
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="Explain why the request was rejected..."
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectUser(null);
                                        setRejectReason('');
                                    }}
                                    disabled={actionLoading === rejectUser?.id}
                                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={actionLoading === rejectUser?.id}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {actionLoading === rejectUser?.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : null}
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
