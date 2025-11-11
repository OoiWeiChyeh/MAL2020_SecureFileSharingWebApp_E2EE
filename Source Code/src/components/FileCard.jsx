import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteFile } from '../services/storageService';
import { deleteFileMetadata, revokeFileAccessByUser, getDownloadHistory, daysUntilExpiration, isFileExpired, submitFileForReview } from '../services/firestoreService';
import { getCurrentUser } from '../services/authService';
import { formatFileSize, formatDate, getFileIcon } from '../utils/helpers';
import { Download, Share2, Trash2, MoreVertical, FileText, Image, Archive, Video, Music, File, History, X, Clock, Send, CheckCircle, AlertCircle, Clock as ClockIcon, FileCheck, GitBranch, UploadCloud, List } from 'lucide-react';
import VersionHistoryModal from './VersionHistoryModal';
import UploadNewVersionModal from './UploadNewVersionModal';
import FileTimelineModal from './FileTimelineModal';

const iconMap = {
  FileText,
  Image,
  Archive,
  Video,
  Music,
  File
};

const CATEGORY_COLORS = {
  'question-paper': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  'answer-key': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  'rubric': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  'marking-scheme': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  'model-answer': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  'other': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' }
};

const CATEGORY_LABELS = {
  'question-paper': '📄 Question Paper',
  'answer-key': '✓ Answer Key',
  'rubric': '📋 Rubric',
  'marking-scheme': '🎯 Marking Scheme',
  'model-answer': '⭐ Model Answer',
  'other': '📎 Other'
};

const WORKFLOW_STATUS = {
  'DRAFT': { label: 'Draft', icon: FileText, color: 'bg-gray-100 text-gray-700 border-gray-300' },
  'PENDING_HOS_REVIEW': { label: 'Pending HOS Review', icon: ClockIcon, color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  'NEEDS_REVISION': { label: 'Needs Revision', icon: AlertCircle, color: 'bg-red-100 text-red-700 border-red-300' },
  'PENDING_EXAM_UNIT': { label: 'Pending Exam Unit', icon: ClockIcon, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  'APPROVED': { label: 'Approved', icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-300' }
};

export default function FileCard({ file, isOwner, onDeleted, onSelect, isSelected, userRole }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showUploadVersion, setShowUploadVersion] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const IconComponent = iconMap[getFileIcon(file.fileType)] || File;
  const category = file.category || 'other';
  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS['other'];
  const daysLeft = daysUntilExpiration(file);
  const expired = isFileExpired(file);
  
  // HOS and Exam Unit can view files but not edit/delete
  const canViewDetails = isOwner || userRole === 'hos' || userRole === 'exam_unit';
  const canEdit = isOwner; // Only owner can upload new version, share, delete

  const handleShare = () => {
    navigate(`/share?fileId=${file.id}`);
  };

  const handleView = () => {
    navigate(`/file?id=${file.id}&key=${encodeURIComponent(file.encryptionKey)}`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const user = getCurrentUser();
      
      // Delete from storage
      await deleteFile(user.uid, file.fileId, file.fileName);
      
      // Delete metadata
      await deleteFileMetadata(file.id);
      
      if (onDeleted) {
        onDeleted();
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Failed to delete file');
    } finally {
      setDeleting(false);
    }
  };

  const handleShowHistory = async () => {
    setHistoryLoading(true);
    try {
      const history = await getDownloadHistory(file.id);
      setDownloadHistory(history || []);
      setShowHistory(true);
    } catch (err) {
      console.error('Error loading history:', err);
      alert('Failed to load download history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRevokeAccess = async (email) => {
    if (!confirm(`Revoke access for ${email}?`)) return;
    
    try {
      await revokeFileAccessByUser(file.id, email);
      // Trigger refresh
      if (onDeleted) onDeleted();
    } catch (err) {
      console.error('Error revoking access:', err);
      alert('Failed to revoke access');
    }
  };

  const handleSubmitForReview = async () => {
    if (!confirm('Submit this file for HOS review?')) return;

    try {
      setSubmitting(true);
      const user = getCurrentUser();
      await submitFileForReview(file.id, user.uid, user.displayName || user.email);
      alert('File submitted for review successfully!');
      if (onDeleted) onDeleted(); // Refresh
    } catch (err) {
      console.error('Error submitting for review:', err);
      alert('Failed to submit for review');
    } finally {
      setSubmitting(false);
    }
  };

  const workflowStatus = file.workflowStatus || 'DRAFT';
  const statusInfo = WORKFLOW_STATUS[workflowStatus] || WORKFLOW_STATUS['DRAFT'];
  const StatusIcon = statusInfo.icon;

  return (
    <>
      <div className={`bg-white border-2 rounded-xl p-4 hover:shadow-md transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}>
        {/* Checkbox for batch selection */}
        {onSelect && (
          <div className="flex items-start justify-between mb-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(file.id, e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded cursor-pointer"
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 truncate text-sm" title={file.fileName}>
                {file.fileName}
              </h3>
              <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
            </div>
          </div>

          {/* Menu */}
          <div className="relative ml-2 flex-shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                ></div>
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => {
                      handleView();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  
                  {/* Version control features - available to HOS, Exam Unit, and Owner */}
                  {canViewDetails && (
                    <>
                      <button
                        onClick={() => {
                          setShowTimeline(true);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50"
                      >
                        <List className="w-4 h-4" />
                        File Timeline
                      </button>
                      <button
                        onClick={() => {
                          setShowVersionHistory(true);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700"
                      >
                        <GitBranch className="w-4 h-4" />
                        Version History
                      </button>
                      <button
                        onClick={() => {
                          handleShowHistory();
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700"
                      >
                        <History className="w-4 h-4" />
                        Download History
                      </button>
                    </>
                  )}
                  
                  {/* Owner-only features */}
                  {canEdit && (
                    <>
                      <button
                        onClick={() => {
                          setShowUploadVersion(true);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        <UploadCloud className="w-4 h-4" />
                        Upload New Version
                      </button>
                      <button
                        onClick={() => {
                          handleShare();
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                      <button
                        onClick={() => {
                          handleDelete();
                          setMenuOpen(false);
                        }}
                        disabled={deleting}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Category Badge */}
        <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-3 ${categoryColor.bg} ${categoryColor.text}`}>
          {CATEGORY_LABELS[category]}
        </div>

        {/* Workflow Status Badge */}
        <div className={`inline-block ml-2 px-2 py-1 rounded text-xs font-medium border mb-3 ${statusInfo.color}`}>
          <StatusIcon className="w-3 h-3 inline mr-1" />
          {statusInfo.label}
        </div>

        {/* Expiration Badge */}
        {file.expiresAt && daysLeft !== null && (
          <div className={`inline-block ml-2 px-2 py-1 rounded text-xs font-medium mb-3 ${
            expired ? 'bg-red-100' : daysLeft <= 3 ? 'bg-yellow-100' : 'bg-green-100'
          }`}>
            <Clock className="w-3 h-3 inline mr-1" />
            {expired ? 'EXPIRED' : `${daysLeft}d left`}
          </div>
        )}

        {/* Lecturer and Subject Info (for HOS/Exam Unit) */}
        {!isOwner && (userRole === 'hos' || userRole === 'exam_unit') && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs space-y-1">
            {file.createdByName && (
              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-medium">Lecturer:</span>
                <span className="text-blue-900">{file.createdByName}</span>
              </div>
            )}
            {file.subjectCode && (
              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-medium">Subject:</span>
                <span className="text-blue-900">{file.subjectCode}</span>
              </div>
            )}
            {file.version && (
              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-medium">Version:</span>
                <span className="text-blue-900">v{file.version}</span>
              </div>
            )}
          </div>
        )}

        {/* File Info */}
        <div className="space-y-1 mb-3 text-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span>Uploaded:</span>
            <span className="font-medium text-gray-700">{file.createdAt ? formatDate(file.createdAt) : 'N/A'}</span>
          </div>
          
          {/* Download Count */}
          <div className="flex items-center justify-between text-gray-500">
            <span>📥 Downloads:</span>
            <span className="font-medium text-gray-700">{file.downloads || 0}</span>
          </div>

          {/* Shared With Count */}
          {isOwner && file.sharedWith && file.sharedWith.length > 0 && (
            <div className="flex items-center justify-between text-gray-500">
              <span>👥 Shared:</span>
              <span className="font-medium text-gray-700">{file.sharedWith.length} people</span>
            </div>
          )}
        </div>

        {/* Shared With Preview & Revoke */}
        {isOwner && file.sharedWith && file.sharedWith.length > 0 && (
          <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
            <p className="text-gray-600 font-medium mb-2">Shared with:</p>
            <div className="flex flex-wrap gap-1">
              {file.sharedWith.map((email, idx) => (
                <div key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs group">
                  <span className="truncate">{email.split('@')[0]}</span>
                  <button
                    onClick={() => handleRevokeAccess(email)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Revoke access"
                  >
                    <X className="w-3 h-3 cursor-pointer hover:text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Encryption Badge */}
        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded mb-3">
          <span>🔒</span>
          <span>AES-256 Encrypted</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleView}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
          {isOwner && (
            <button
              onClick={handleShare}
              className="px-3 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              title="Share this file"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Submit for Review Button (Only for owner and DRAFT or NEEDS_REVISION status) */}
        {isOwner && (workflowStatus === 'DRAFT' || workflowStatus === 'NEEDS_REVISION') && (
          <button
            onClick={handleSubmitForReview}
            disabled={submitting}
            className="w-full mt-2 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1 disabled:bg-green-400"
          >
            <Send className="w-3 h-3" />
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        )}
      </div>

      {/* Download History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">📥 Download History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {historyLoading ? (
                <p className="text-center text-gray-600">Loading...</p>
              ) : downloadHistory.length === 0 ? (
                <p className="text-center text-gray-600">No downloads yet</p>
              ) : (
                <div className="space-y-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-600">Email</th>
                          <th className="px-4 py-2 text-left text-gray-600">Downloaded</th>
                        </tr>
                      </thead>
                      <tbody>
                        {downloadHistory.map((entry, idx) => (
                          <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-900">{entry.email || 'Anonymous'}</td>
                            <td className="px-4 py-2 text-gray-600">
                              {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionHistory && (
        <VersionHistoryModal
          fileId={file.id}
          currentVersion={file.version}
          encryptionKey={file.encryptionKey}
          onClose={() => setShowVersionHistory(false)}
        />
      )}

      {/* Upload New Version Modal */}
      {showUploadVersion && (
        <UploadNewVersionModal
          fileId={file.id}
          currentVersion={file.version || 1}
          onClose={() => setShowUploadVersion(false)}
          onSuccess={() => {
            if (onDeleted) onDeleted(); // Refresh file list
          }}
        />
      )}

      {/* File Timeline Modal */}
      {showTimeline && (
        <FileTimelineModal
          file={file}
          onClose={() => setShowTimeline(false)}
        />
      )}
    </>
  );
}
