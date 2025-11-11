import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Building2, BookOpen, GraduationCap } from 'lucide-react';
import { getCurrentUser } from '../../services/authService';
import { getUserProfile, isExamUnit } from '../../services/roleService';
import Navbar from '../../components/Navbar';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
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
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const adminSections = [
    {
      title: 'User Management',
      description: 'Approve pending users and assign roles',
      icon: Users,
      path: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      title: 'Department Management',
      description: 'Create and manage departments',
      icon: Building2,
      path: '/admin/departments',
      color: 'bg-green-500'
    },
    {
      title: 'Course Management',
      description: 'Manage courses under departments',
      icon: BookOpen,
      path: '/admin/courses',
      color: 'bg-purple-500'
    },
    {
      title: 'Subject Assignment',
      description: 'Assign subjects to lecturers',
      icon: GraduationCap,
      path: '/admin/subjects',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Exam Unit Admin Panel</h1>
          </div>
          <p className="text-gray-600">Manage users, departments, courses, and subjects</p>
        </div>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.path}
                onClick={() => navigate(section.path)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className={`${section.color} rounded-lg p-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {section.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

