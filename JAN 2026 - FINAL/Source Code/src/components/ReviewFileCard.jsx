import { useState } from 'react';
import { Eye, CheckCircle, XCircle, FileText, User, BookOpen, Calendar, FileCheck, MoreVertical, History, GitBranch, List, X } from 'lucide-react';
import { formatFileSize, formatDate } from '../utils/helpers';
import VersionHistoryModal from './VersionHistoryModal';
import FileTimelineModal from './FileTimelineModal';

export default function ReviewFileCard({ file, onViewPDF, onApprove, onReject, showComments = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  
  const isApproved = file.workflowStatus === 'APPROVED' || file.examUnitApprovedAt;
  
  // Determine card background color based on status
  const getCardBackground = () => {
    const status = file.workflowStatus;
    if (status === 'PENDING_HOS_REVIEW' || status === 'PENDING_EXAM_UNIT') {
      return 'bg-yellow-50/50 border-yellow-300'; // Yellow for files needing review
    } else if (status === 'APPROVED') {
      return 'bg-green-50/50 border-green-300'; // Green for final approval
    } else if (status === 'PENDING_EXAM_UNIT' && file.hosApprovedAt) {
      return 'bg-yellow-50/50 border-yellow-300'; // Yellow for waiting Exam Unit approval
    } else if (status === 'NEEDS_REVISION') {
      return 'bg-red-50/50 border-red-300'; // Red for rejected/needs revision
    }
    return 'bg-white border-gray-200'; // Default
  };

  const handleShowHistory = async () => {
    setHistoryLoading(true);
    try {
      const { getDownloadHistory } = await import('../services/firestoreService');
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

  return (
    <>
      <div className={`border-2 rounded-xl p-5 hover:shadow-lg transition-all flex flex-col h-full ${getCardBackground()}`}>
        {/* Header - File Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-snug" title={file.fileName}>
              {file.fileName}
            </h3>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="font-medium">{formatFileSize(file.fileSize)}</span>
              {file.createdAt && (
                <>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(file.createdAt)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 3-Dot Menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <GitBranch className="w-4 h-4" />
                    Version History
                  </button>
                  <button
                    onClick={() => {
                      handleShowHistory();
                      setMenuOpen(false);
                    }}
                    disabled={historyLoading}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <History className="w-4 h-4" />
                    {historyLoading ? 'Loading...' : 'Download History'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content Section - Consistent spacing */}
        <div className="space-y-3 mb-4 flex-grow">
          {/* Lecturer Info */}
          {file.createdByName && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <User className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1 font-medium">Lecturer</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{file.createdByName}</p>
              </div>
            </div>
          )}

          {/* Subject Info */}
          {file.subjectCode && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <BookOpen className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1 font-medium">Subject</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{file.subjectCode}</p>
                {file.subjectName && (
                  <p className="text-xs text-gray-600 truncate mt-0.5">{file.subjectName}</p>
                )}
              </div>
            </div>
          )}

          {/* Version Badge */}
          {file.version && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">Version {file.version}</span>
            </div>
          )}

          {/* Approval Status Badge */}
          {isApproved && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
              <CheckCircle className="w-4 h-4" />
              Approved
            </div>
          )}

          {/* Revision requested by: HOS or Exam Unit */}
          {file.workflowStatus === 'NEEDS_REVISION' && (
            file.examUnitRejectedAt ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-800 mb-1">Revision requested by: Exam Unit</p>
                {file.examUnitRejectedByName && (
                  <p className="text-xs text-red-700 mb-1">By {file.examUnitRejectedByName}</p>
                )}
                {file.examUnitRejectionReason && (
                  <p className="text-xs text-red-600 mt-1 leading-relaxed">{file.examUnitRejectionReason}</p>
                )}
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-orange-800 mb-1">Revision requested by: HOS</p>
                {file.hosRejectedByName && (
                  <p className="text-xs text-orange-700 mb-1">By {file.hosRejectedByName}</p>
                )}
                {file.hosRejectionReason && (
                  <p className="text-xs text-orange-600 mt-1 leading-relaxed">{file.hosRejectionReason}</p>
                )}
              </div>
            )
          )}

          {/* HOS Comments */}
          {showComments && file.hosComments && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-1.5">HOS Comments:</p>
              <p className="text-sm text-blue-800 line-clamp-3 leading-relaxed">{file.hosComments}</p>
            </div>
          )}
        </div>

        {/* Action Buttons - Two rows layout */}
        <div className="space-y-2 pt-4 border-t-2 border-gray-200 mt-auto">
          {/* Top Row: View PDF Button (Full Width) */}
          {onViewPDF && (
            <button
              onClick={() => onViewPDF(file)}
              className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Eye className="w-4 h-4" />
              View PDF
            </button>
          )}

          {/* Bottom Row: Approve and Request Revision (Side by Side) */}
          {(onApprove || onReject) && (
            <div className="flex gap-2">
              {onApprove && (
                <button
                  onClick={() => onApprove(file)}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
              )}
              {onReject && (
                <button
                  onClick={() => onReject(file)}
                  className="flex-1 px-4 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Request Revision
                </button>
              )}
            </div>
          )}
        </div>
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
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No downloads yet</p>
                  <p className="text-sm text-gray-500 mt-1">Download history will appear here</p>
                </div>
              ) : (
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
