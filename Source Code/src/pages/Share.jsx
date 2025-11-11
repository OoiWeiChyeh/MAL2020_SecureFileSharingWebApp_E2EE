import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getFileMetadata, shareFile } from '../services/firestoreService';
import { getCurrentUser } from '../services/authService';
import { copyToClipboard } from '../utils/helpers';
import Navbar from '../components/Navbar';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Link as LinkIcon, QrCode, Mail, Copy, CheckCircle, AlertCircle, X, Download, Upload } from 'lucide-react';

export default function Share() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileId = searchParams.get('fileId');
  const qrRef = useRef();
  const fileInputRef = useRef();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareMode, setShareMode] = useState('link');
  const [emailInput, setEmailInput] = useState('');
  const [sharedEmails, setSharedEmails] = useState([]);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [qrScanned, setQrScanned] = useState('');

  useEffect(() => {
    if (!fileId) {
      navigate('/dashboard');
      return;
    }
    loadFile();
  }, [fileId]);

  const loadFile = async () => {
    try {
      setLoading(true);
      const fileData = await getFileMetadata(fileId);
      
      const user = getCurrentUser();
      if (fileData.ownerId !== user.uid) {
        setError('You do not have permission to share this file');
        return;
      }

      setFile(fileData);
      setSharedEmails(fileData.sharedWith || []);
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const generateShareLink = () => {
    if (!file) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/file?id=${fileId}&key=${encodeURIComponent(file.encryptionKey)}`;
  };

  const handleCopyLink = async () => {
    const link = generateShareLink();
    const success = await copyToClipboard(link);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (qrRef.current) {
      // Try to find SVG first (QRCodeSVG renders as SVG)
      const svg = qrRef.current.querySelector('svg');
      if (svg) {
        // Convert SVG to canvas for download
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `file-share-qr-${fileId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        };
        
        img.src = url;
      } else {
        // Fallback: try canvas method
        const canvas = qrRef.current.querySelector('canvas');
        if (canvas) {
          const url = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = url;
          link.download = `file-share-qr-${fileId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          alert('QR code not found. Please try again.');
        }
      }
    } else {
      alert('QR code not ready. Please try again.');
    }
  };

  const handleShareByEmail = async () => {
    if (!emailInput.trim()) return;

    setSharing(true);
    try {
      await shareFile(fileId, [emailInput.trim()]);
      setSharedEmails([...sharedEmails, emailInput.trim()]);
      setEmailInput('');
    } catch (err) {
      console.error('Error sharing file:', err);
      alert('Failed to share file');
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveAccess = async (email) => {
    try {
      // Remove from shared list (you would call revokeFileAccess here)
      setSharedEmails(sharedEmails.filter(e => e !== email));
    } catch (err) {
      console.error('Error removing access:', err);
    }
  };

  const handleQRUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simple QR code detection - in production, use a library like jsQR
    const reader = new FileReader();
    reader.onload = (event) => {
      // For now, show info about QR scanning
      setQrScanned(`QR code file selected: ${file.name}. In production, this would be scanned using jsQR library.`);
      
      // In a real implementation, you'd use jsQR or similar to decode the QR code
      // and extract the link, then navigate to it
    };
    reader.readAsArrayBuffer(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Share File</h1>
          <p className="text-gray-600">Share encrypted file securely with others</p>
        </div>

        {/* File Info */}
        <div className="bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Share2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{file?.fileName}</h2>
              <p className="text-sm text-gray-500">Encrypted file</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ Anyone with the link can decrypt and view this file. Share carefully.
            </p>
          </div>
        </div>

        {/* Share Mode Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setShareMode('link')}
              className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap min-w-max ${
                shareMode === 'link'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LinkIcon className="w-5 h-5" />
              Share Link
            </button>
            <button
              onClick={() => setShareMode('qr')}
              className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap min-w-max ${
                shareMode === 'qr'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <QrCode className="w-5 h-5" />
              QR Code
            </button>
            <button
              onClick={() => setShareMode('scan')}
              className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap min-w-max ${
                shareMode === 'scan'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-5 h-5" />
              Scan QR
            </button>
            <button
              onClick={() => setShareMode('email')}
              className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap min-w-max ${
                shareMode === 'email'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="w-5 h-5" />
              By Email
            </button>
          </div>

          <div className="p-6">
            {/* Link Sharing */}
            {shareMode === 'link' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shareable Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generateShareLink()}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This link contains the encryption key. Anyone with this link can decrypt the file.
                </p>
              </div>
            )}

            {/* QR Code Sharing */}
            {shareMode === 'qr' && (
              <div className="text-center">
                <div ref={qrRef} className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
                  <QRCodeSVG value={generateShareLink()} size={256} level="H" />
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Scan this QR code to access the encrypted file
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 text-left">
                  <p className="text-sm text-blue-800 font-medium mb-2">How to share:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Download the QR code and send it via email/message</li>
                    <li>• Recipients can scan it with their phone camera</li>
                    <li>• Or they can visit /access page to upload the QR image</li>
                  </ul>
                </div>
                <div className="flex gap-2 justify-center mt-4">
                  <button
                    onClick={handleDownloadQR}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download QR Code
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-5 h-5" />
                    Copy Link Instead
                  </button>
                </div>
              </div>
            )}

            {/* QR Code Scanner */}
            {shareMode === 'scan' && (
              <div className="text-center">
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    Upload a QR code image to scan and open the shared file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQRUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Upload className="w-5 h-5" />
                    Upload QR Code Image
                  </button>
                </div>
                
                {qrScanned && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">{qrScanned}</p>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Tip: You can also share the QR code image directly through messaging apps, email, or other platforms!
                  </p>
                </div>
              </div>
            )}

            {/* Email Sharing */}
            {shareMode === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share with Email
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleShareByEmail}
                    disabled={sharing || !emailInput.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {sharing ? 'Sharing...' : 'Share'}
                  </button>
                </div>

                {/* Shared With List */}
                {sharedEmails.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Shared with:</p>
                    <div className="space-y-2">
                      {sharedEmails.map((email) => (
                        <div
                          key={email}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-gray-700">{email}</span>
                          <button
                            onClick={() => handleRemoveAccess(email)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">🔒 Security Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• The encryption key is included in the share link</li>
            <li>• Recipients can decrypt and view the file with the link</li>
            <li>• Revoke access by deleting the file or changing permissions</li>
            <li>• Files are never stored in plaintext on the server</li>
          </ul>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
