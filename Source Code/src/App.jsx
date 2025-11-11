import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthChange } from './services/authService';
import { isEncryptionAvailable } from './services/encryptionService';
import { getUserRole } from './services/firestoreService';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Share from './pages/Share';
import ViewFile from './pages/ViewFile';
import AccessFile from './pages/AccessFile';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import PendingApproval from './pages/PendingApproval';
import HOSReview from './pages/HOSReview';
import ExamUnitReview from './pages/ExamUnitReview';

// Protected Route Component
function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const role = await getUserRole(currentUser.uid);
          setUserRole(role);
        } catch (err) {
          console.error('Error getting user role:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect pending users to pending approval page
  if (userRole === 'pending') {
    return <Navigate to="/pending" replace />;
  }

  return children;
}

// Public Route Component (redirect to dashboard if already logged in)
function PublicRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  const [encryptionSupported, setEncryptionSupported] = useState(true);

  useEffect(() => {
    // Check if Web Crypto API is available
    if (!isEncryptionAvailable()) {
      setEncryptionSupported(false);
      alert('Your browser does not support Web Crypto API. Please use a modern browser with HTTPS.');
    }
  }, []);

  if (!encryptionSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Browser Not Supported</h1>
          <p className="text-gray-600 mb-4">
            Your browser does not support the Web Crypto API required for end-to-end encryption.
          </p>
          <p className="text-sm text-gray-500">
            Please use a modern browser (Chrome, Firefox, Safari, Edge) with HTTPS enabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/share"
          element={
            <ProtectedRoute>
              <Share />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Pending Approval Page */}
        <Route path="/pending" element={<PendingApproval />} />

        {/* HOS Review Page */}
        <Route
          path="/hos-review"
          element={
            <ProtectedRoute>
              <HOSReview />
            </ProtectedRoute>
          }
        />

        {/* Exam Unit Review Page */}
        <Route
          path="/exam-review"
          element={
            <ProtectedRoute>
              <ExamUnitReview />
            </ProtectedRoute>
          }
        />

        {/* Public file viewing (with key in URL) */}
        <Route path="/file" element={<ViewFile />} />
        <Route path="/view/:fileId" element={<ViewFile />} />
        
        {/* Public access page for QR codes and links */}
        <Route path="/access" element={<AccessFile />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-4">Page not found</p>
                <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
                  Go to Dashboard
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
