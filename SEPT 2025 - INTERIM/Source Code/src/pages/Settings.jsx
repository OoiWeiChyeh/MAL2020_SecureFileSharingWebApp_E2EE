import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../services/authService';
import Navbar from '../components/Navbar';
import { User, Mail, Shield, LogOut, Trash2, AlertCircle } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
      alert('Failed to log out');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // This would require additional Firebase setup to delete user account
    alert('Account deletion feature requires additional Firebase configuration');
    setShowDeleteConfirm(false);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-full" />
                ) : (
                  <User className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{user.displayName || 'User'}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-700">Email</p>
                </div>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-700">Display Name</p>
                </div>
                <p className="text-sm text-gray-900">{user.displayName || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Security
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">🔒 End-to-End Encryption</h3>
              <p className="text-sm text-green-800">
                All your files are encrypted with AES-256-GCM before uploading. Only you have access to the encryption keys.
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">🛡️ Zero-Knowledge Architecture</h3>
              <p className="text-sm text-blue-800">
                Your files are encrypted in your browser. We never see your data or encryption keys.
              </p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">🔐 Secure Sharing</h3>
              <p className="text-sm text-purple-800">
                Share files via encrypted links or QR codes. Recipients decrypt files locally in their browser.
              </p>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Actions</h2>

          <div className="space-y-3">
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full flex items-center justify-between p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Sign Out</p>
                  <p className="text-sm text-gray-500">Sign out of your account</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between p-4 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-600" />
                <div className="text-left">
                  <p className="font-medium text-red-900">Delete Account</p>
                  <p className="text-sm text-red-600">Permanently delete your account and all files</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong className="text-gray-900">App Name:</strong> Secure Share Web</p>
            <p><strong className="text-gray-900">Version:</strong> 1.0.0</p>
            <p><strong className="text-gray-900">Encryption:</strong> AES-256-GCM (Web Crypto API)</p>
            <p><strong className="text-gray-900">Storage:</strong> Firebase Cloud Storage</p>
            <p className="pt-2 text-xs">
              Built for secure, privacy-focused file sharing with end-to-end encryption.
            </p>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Account?</h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone. All your files and data will be permanently deleted.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
