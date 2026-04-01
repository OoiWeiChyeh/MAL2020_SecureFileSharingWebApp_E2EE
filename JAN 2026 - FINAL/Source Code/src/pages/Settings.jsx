import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../services/authService';
import { getUserProfile, updateUserProfile } from '../services/firestoreService';
import { multiFactor, TotpMultiFactorGenerator } from 'firebase/auth';
import QRCode from 'qrcode';
import Navbar from '../components/Navbar';
import { User, Mail, Shield, LogOut, Trash2, AlertCircle, Bell, CheckCircle, Smartphone, Check, X } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [savingEmailPrefs, setSavingEmailPrefs] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // 2FA State
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [mfaSetup, setMfaSetup] = useState({ active: false, qrCodeUrl: '', secret: null, verificationCode: '', error: '', loading: false });

  useEffect(() => {
    loadUserProfile();
    checkMfaStatus();
  }, []);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
      setEmailNotificationsEnabled(profile.emailNotificationsEnabled !== false); // Default to true
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  const checkMfaStatus = () => {
    if (user && user.multiFactor) {
      const enrolled = user.multiFactor.enrolledFactors?.some(f => f.factorId === 'totp') || false;
      setMfaEnrolled(enrolled);
    }
  };

  const startMfaSetup = async () => {
    setMfaSetup(s => ({ ...s, active: true, loading: true, error: '' }));
    try {
      const session = await multiFactor(user).getSession();
      const tSecret = await TotpMultiFactorGenerator.generateSecret(session);
      const url = await QRCode.toDataURL(tSecret.generateQrCodeUrl(user.email, 'KUNCHEE'));
      setMfaSetup({ active: true, qrCodeUrl: url, secret: tSecret, verificationCode: '', error: '', loading: false });
    } catch (err) {
      console.error('Error starting MFA setup:', err);
      // Commonly fails if user hasn't authenticated recently
      if (err.code === 'auth/requires-recent-login') {
        alert('Please log out and log back in before enabling 2FA for security reasons.');
      } else {
        alert('Failed to start 2FA setup. ' + err.message);
      }
      setMfaSetup(s => ({ ...s, active: false, loading: false }));
    }
  };

  const finalizeMfaSetup = async () => {
    if (!mfaSetup.secret || mfaSetup.verificationCode.length !== 6) {
      setMfaSetup(s => ({ ...s, error: 'Please enter a valid 6-digit code' }));
      return;
    }
    setMfaSetup(s => ({ ...s, loading: true, error: '' }));
    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(mfaSetup.secret, mfaSetup.verificationCode);
      await multiFactor(user).enroll(assertion, 'Authenticator App');
      setMfaEnrolled(true);
      setMfaSetup({ active: false, qrCodeUrl: '', secret: null, verificationCode: '', error: '', loading: false });
      alert('Two-factor authentication successfully enabled!');
    } catch (err) {
      console.error('Error finalizing MFA:', err);
      setMfaSetup(s => ({ ...s, error: 'Invalid code. Please try again.', loading: false }));
    }
  };

  const disableMfa = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
      return;
    }
    try {
      const factorUid = user.multiFactor.enrolledFactors.find(f => f.factorId === 'totp')?.uid;
      if (factorUid) {
        await multiFactor(user).unenroll(factorUid);
        setMfaEnrolled(false);
        alert('Two-factor authentication has been disabled.');
      }
    } catch (err) {
      console.error('Error disabling MFA:', err);
      if (err.code === 'auth/requires-recent-login') {
        alert('Please log out and log back in before disabling 2FA.');
      } else {
        alert('Failed to disable 2FA. ' + err.message);
      }
    }
  };

  const handleToggleEmailNotifications = async () => {
    if (!user) return;

    setSavingEmailPrefs(true);
    try {
      const newValue = !emailNotificationsEnabled;
      await updateUserProfile(user.uid, {
        emailNotificationsEnabled: newValue
      });
      setEmailNotificationsEnabled(newValue);
      await loadUserProfile();
    } catch (err) {
      console.error('Error updating email preferences:', err);
      alert('Failed to update email preferences');
    } finally {
      setSavingEmailPrefs(false);
    }
  };

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

        {/* Email Notifications Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            Email Notifications
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Email Notifications</h3>
                  <p className="text-sm text-blue-800">
                    Receive email notifications when you get new notifications in the system
                  </p>
                </div>
                <button
                  onClick={handleToggleEmailNotifications}
                  disabled={savingEmailPrefs}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${emailNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    } ${savingEmailPrefs ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {emailNotificationsEnabled && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    You'll receive emails for: approvals, rejections, review requests, and feedback
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">What you'll receive:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• File approval notifications</li>
                <li>• Revision requests</li>
                <li>• Review requests</li>
                <li>• Feedback and comments</li>
                <li>• Role assignment updates</li>
              </ul>
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

        {/* Two-Factor Authentication Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-blue-600" />
            Two-Factor Authentication (2FA)
          </h2>

          <div className="space-y-4">
            {!mfaEnrolled && !mfaSetup.active && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Authenticator App</h3>
                  <p className="text-sm text-gray-600">
                    Add an extra layer of security to your account using an authenticator app.
                  </p>
                </div>
                <button
                  onClick={startMfaSetup}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap text-sm font-medium"
                >
                  Enable 2FA
                </button>
              </div>
            )}

            {mfaEnrolled && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-green-900 mb-1 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    2FA is Enabled
                  </h3>
                  <p className="text-sm text-green-800">
                    Your account is protected with an authenticator app.
                  </p>
                </div>
                <button
                  onClick={disableMfa}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap text-sm font-medium"
                >
                  Disable 2FA
                </button>
              </div>
            )}

            {mfaSetup.active && (
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-blue-900 text-lg">Set up Authenticator App</h3>
                  <button onClick={() => setMfaSetup({ active: false, qrCodeUrl: '', secret: null, verificationCode: '', error: '', loading: false })} className="text-gray-500 hover:text-gray-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-blue-800">
                    1. Scan this QR code with your authenticator app (like Google or Microsoft Authenticator).
                  </p>

                  {mfaSetup.loading ? (
                    <div className="flex justify-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    mfaSetup.qrCodeUrl && (
                      <div className="flex justify-center bg-white p-4 rounded-lg mx-auto border border-gray-200" style={{ width: 'fit-content' }}>
                        <img src={mfaSetup.qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                      </div>
                    )
                  )}

                  <p className="text-sm text-blue-800 pt-2">
                    2. Enter the 6-digit code generated by the app.
                  </p>

                  <div className="flex space-x-3">
                    <input
                      type="text"
                      maxLength="6"
                      value={mfaSetup.verificationCode}
                      onChange={(e) => setMfaSetup({ ...mfaSetup, verificationCode: e.target.value.replace(/\D/g, '') })}
                      placeholder="000000"
                      className="flex-1 px-4 py-2 border border-blue-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest text-lg font-mono outline-none"
                    />
                    <button
                      onClick={finalizeMfaSetup}
                      disabled={mfaSetup.verificationCode.length !== 6 || mfaSetup.loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 font-medium"
                    >
                      {mfaSetup.loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>

                  {mfaSetup.error && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                      <AlertCircle className="w-4 h-4" />
                      {mfaSetup.error}
                    </p>
                  )}
                </div>
              </div>
            )}
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
