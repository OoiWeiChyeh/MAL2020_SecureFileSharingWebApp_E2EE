import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../services/authService';
import { getUserRole } from '../services/firestoreService';
import { Lock, LayoutDashboard, Upload, Settings, LogOut, Menu, X, User, Shield, FileCheck } from 'lucide-react';
import NotificationsPanel from './NotificationsPanel';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const loadUserRole = async () => {
      if (user) {
        try {
          const role = await getUserRole(user.uid);
          setUserRole(role);
        } catch (err) {
          console.error('Error loading user role:', err);
        }
      }
    };
    loadUserRole();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  // Add Upload link only for lecturers
  if (userRole === 'lecturer') {
    navLinks.splice(1, 0, { path: '/upload', icon: Upload, label: 'Upload' });
  }

  // Add Review link for HOS users
  if (userRole === 'hos') {
    navLinks.splice(1, 0, { path: '/hos-review', icon: FileCheck, label: 'Review Files' });
  }

  // Add Review & Admin links for Exam Unit users
  if (userRole === 'exam_unit') {
    navLinks.splice(1, 0, { path: '/exam-review', icon: FileCheck, label: 'Review Files' });
    navLinks.push({ path: '/admin', icon: Shield, label: 'Admin' });
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 hidden sm:block">Secure Share</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive(link.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Right side: Notifications + User Menu */}
          <div className="hidden md:flex items-center gap-2">
            {/* Notifications */}
            <NotificationsPanel />

          {/* User Menu */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">{user?.displayName || user?.email}</span>
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(link.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
              
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
