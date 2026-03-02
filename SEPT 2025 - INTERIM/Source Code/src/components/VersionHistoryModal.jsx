import { useState, useEffect } from 'react';
import { X, Download, Clock, User, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { getFileVersions } from '../services/firestoreService';
import { formatFileSize, formatDate } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

export default function VersionHistoryModal({ fileId, currentVersion, encryptionKey, onClose }) {
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersions, setExpandedVersions] = useState({});

  useEffect(() => {
    loadVersions();
  }, [fileId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const versionList = await getFileVersions(fileId);
      setVersions(versionList.reverse()); // Show newest first
      
      // Auto-expand the current version
      if (currentVersion) {
        setExpandedVersions({ [currentVersion]: true });
      }
    } catch (err) {
      console.error('Error loading versions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVersion = (version) => {
    setExpandedVersions(prev => ({
      ...prev,
      [version]: !prev[version]
    }));
  };

  const handleDownloadVersion = (version) => {
    // Navigate to file view with specific version's encryption key
    navigate(`/file?id=${fileId}&key=${encodeURIComponent(version.encryptionKey)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Version History</h3>
            <p className="text-sm text-gray-600 mt-1">
              {versions.length} version{versions.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No version history available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => {
                const isExpanded = expandedVersions[version.version];
                const isCurrent = version.version === currentVersion;
                
                return (
                  <div
                    key={version.id}
                    className={`border-2 rounded-lg transition-all ${
                      isCurrent 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {/* Version Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => toggleVersion(version.version)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors mt-1"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-semibold ${isCurrent ? 'text-blue-700' : 'text-gray-900'}`}>
                                Version {version.version}
                              </span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                                  Current
                                </span>
                              )}
                              {index === 0 && !isCurrent && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  Latest
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{version.uploadedByName || 'Unknown'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{version.uploadedAt ? formatDate(version.uploadedAt) : 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                <span>{formatFileSize(version.fileSize)}</span>
                              </div>
                            </div>

                            {version.description && (
                              <p className="text-sm text-gray-700 mt-2 italic">
                                "{version.description}"
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDownloadVersion(version)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                            isCurrent
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 mb-1">File Name</p>
                              <p className="font-medium text-gray-900 truncate">
                                {version.fileName}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">File Size</p>
                              <p className="font-medium text-gray-900">
                                {formatFileSize(version.fileSize)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Uploaded By</p>
                              <p className="font-medium text-gray-900">
                                {version.uploadedByName || 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Upload Date</p>
                              <p className="font-medium text-gray-900">
                                {version.uploadedAt ? formatDate(version.uploadedAt) : 'N/A'}
                              </p>
                            </div>
                          </div>

                          {version.description && (
                            <div className="pt-2">
                              <p className="text-gray-500 mb-1 text-sm">Description</p>
                              <p className="text-gray-900 text-sm bg-gray-50 p-2 rounded">
                                {version.description}
                              </p>
                            </div>
                          )}

                          <div className="pt-2">
                            <p className="text-xs text-gray-500">
                              🔒 This version is encrypted with AES-256-GCM
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-600">
              💡 Tip: Click on a version to see more details
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

