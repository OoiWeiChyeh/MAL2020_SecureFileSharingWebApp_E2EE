import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Link, QrCode, FileText, ArrowLeft } from 'lucide-react';
import jsQR from 'jsqr';

const AccessFile = () => {
  const [activeTab, setActiveTab] = useState('scan');
  const [linkInput, setLinkInput] = useState('');
  const [qrScanned, setQrScanned] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleQRUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            setQrScanned(`QR Code detected: ${code.data}`);
            // Extract file ID and key from the QR code data
            const url = new URL(code.data);
            const fileId = url.searchParams.get('id');
            const key = url.searchParams.get('key');
            if (fileId && key) {
              // Navigate to the full URL with both ID and key
              navigate(`/file?id=${fileId}&key=${encodeURIComponent(key)}`);
            } else {
              setError('Invalid QR code format - missing file ID or encryption key');
            }
          } else {
            setError('No QR code found in image');
          }
          setIsProcessing(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error processing QR code');
      setIsProcessing(false);
    }
  };

  const handleLinkSubmit = () => {
    if (!linkInput.trim()) {
      setError('Please enter a share link');
      return;
    }

    try {
      const url = new URL(linkInput);
      const fileId = url.searchParams.get('id');
      const key = url.searchParams.get('key');
      if (fileId && key) {
        // Navigate to the full URL with both ID and key
        navigate(`/file?id=${fileId}&key=${encodeURIComponent(key)}`);
      } else {
        setError('Invalid share link format - missing file ID or encryption key');
      }
    } catch (err) {
      setError('Invalid URL format');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setLinkInput(text);
    } catch (err) {
      setError('Unable to access clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Access Shared File</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'scan'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4" />
                Scan QR Code
              </div>
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'link'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Link className="w-4 h-4" />
                Paste Link
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'scan' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Scan QR Code</h3>
                  <p className="text-gray-600 mb-6">
                    Upload a QR code image to access the shared file
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Click to upload QR code image</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                    >
                      {isProcessing ? 'Processing...' : 'Choose File'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleQRUpload}
                      className="hidden"
                    />
                  </div>

                  {qrScanned && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 text-sm">{qrScanned}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'link' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Link className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Paste Share Link</h3>
                  <p className="text-gray-600 mb-6">
                    Paste the share link you received to access the file
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Share Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        placeholder="https://file-share-f8260.web.app/view?id=..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={handlePasteFromClipboard}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Paste from clipboard"
                      >
                        Paste
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleLinkSubmit}
                    disabled={!linkInput.trim()}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    Access File
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3">How to Access Files</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>QR Code Method:</strong> Upload a QR code image that was shared with you</p>
            <p><strong>Link Method:</strong> Paste the share link you received via email or message</p>
            <p><strong>Note:</strong> Files are encrypted and can only be accessed with the correct link or QR code</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessFile;
