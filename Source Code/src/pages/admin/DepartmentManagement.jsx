import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Plus, Edit2, Trash2, UserPlus, Loader2 } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';
import { getUserProfile, isExamUnit, getUsersByRole, USER_ROLES } from '../../services/roleService';
import {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignHOSToDepartment,
  addCourseToDepartment
} from '../../services/departmentService';
import Navbar from '../../components/Navbar';

export default function DepartmentManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [hosUsers, setHosUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', hosId: '' });
  const [processing, setProcessing] = useState(false);

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

    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    try {
      const [depts, hos] = await Promise.all([
        getAllDepartments(),
        getUsersByRole(USER_ROLES.HOS)
      ]);
      setDepartments(depts);
      setHosUsers(hos);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await createDepartment(formData);
      await loadData();
      setShowCreateModal(false);
      setFormData({ name: '', code: '', hosId: '' });
    } catch (error) {
      console.error('Error creating department:', error);
      alert('Failed to create department');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await updateDepartment(editingDept.id, formData);
      await loadData();
      setEditingDept(null);
      setFormData({ name: '', code: '', hosId: '' });
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Failed to update department');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (deptId) => {
    if (!confirm('Are you sure you want to delete this department? This will also delete all courses and subjects.')) return;
    
    setProcessing(true);
    try {
      await deleteDepartment(deptId);
      await loadData();
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department');
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignHOS = async (deptId, hosId) => {
    setProcessing(true);
    try {
      await assignHOSToDepartment(deptId, hosId);
      await loadData();
    } catch (error) {
      console.error('Error assigning HOS:', error);
      alert('Failed to assign HOS');
    } finally {
      setProcessing(false);
    }
  };

  const getHOSName = (hosId) => {
    const hos = hosUsers.find(u => u.id === hosId);
    return hos ? hos.displayName : 'Unassigned';
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Department
            </button>
          </div>
          <p className="text-gray-600">Manage departments and assign Heads of School</p>
        </div>

        {/* Departments List */}
        <div className="grid grid-cols-1 gap-4">
          {departments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No departments yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create First Department
              </button>
            </div>
          ) : (
            departments.map(dept => (
              <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{dept.name}</h3>
                    <p className="text-sm text-gray-600">Code: {dept.code}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingDept(dept);
                        setFormData({ name: dept.name, code: dept.code, hosId: dept.hosId || '' });
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id)}
                      disabled={processing}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => navigate(`/admin/courses/${dept.id}`)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Manage Courses
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Head of School:</span>
                    <span className="text-sm font-medium text-gray-900">{getHOSName(dept.hosId)}</span>
                  </div>
                  <select
                    value={dept.hosId || ''}
                    onChange={(e) => handleAssignHOS(dept.id, e.target.value)}
                    disabled={processing}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select HOS</option>
                    {hosUsers.map(hos => (
                      <option key={hos.id} value={hos.id}>
                        {hos.displayName} ({hos.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{dept.courses?.length || 0}</span> courses
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || editingDept) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingDept ? 'Edit Department' : 'Create Department'}
              </h2>
              <form onSubmit={editingDept ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="School of Computing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="SOC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Head of School (Optional)
                  </label>
                  <select
                    value={formData.hosId}
                    onChange={(e) => setFormData({ ...formData, hosId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select HOS</option>
                    {hosUsers.map(hos => (
                      <option key={hos.id} value={hos.id}>
                        {hos.displayName} ({hos.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {editingDept ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingDept ? 'Update Department' : 'Create Department'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingDept(null);
                      setFormData({ name: '', code: '', hosId: '' });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

