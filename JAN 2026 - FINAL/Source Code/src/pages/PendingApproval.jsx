import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../services/authService';
import { getUserRole } from '../services/firestoreService';
import { Clock, Shield, CheckCircle, LogOut, RefreshCw } from 'lucide-react';

export default function PendingApproval() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const user = getCurrentUser();

  useEffect(() => {
    checkApprovalStatus();
  }, []);

  const checkApprovalStatus = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const role = await getUserRole(user.uid);
      if (role !== 'pending') {
        // User has been approved! Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error checking role:', err);
    }
  };

  const handleCheckAgain = async () => {
    setChecking(true);
    await checkApprovalStatus();
    setTimeout(() => setChecking(false), 1000);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
            <Clock className="w-10 h-10 text-yellow-600 animate-pulse" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Waiting for Approval
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            Your account is pending approval from the Exam Unit administrator. 
            You'll receive access once your account has been reviewed.
          </p>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-600">
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
              Status: Pending
            </div>
          </div>

          {/* Steps */}
          <div className="text-left mb-6 bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              What happens next?
            </h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>Exam Unit reviews your registration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>You'll be assigned a role (Lecturer or HOS)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
                <span>Access granted - you can start using the system!</span>
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleCheckAgain}
              disabled={checking}
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking...' : 'Check Status'}
            </button>

            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-xs text-gray-500">
            Need help? Contact your Exam Unit administrator
          </p>
        </div>

        {/* Auto-refresh notice */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            💡 Tip: Refresh this page or click "Check Status" after approval
          </p>
        </div>
      </div>
    </div>
  );
}

