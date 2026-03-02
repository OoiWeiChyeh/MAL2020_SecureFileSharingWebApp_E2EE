import { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, AlertCircle, User, MessageSquare, Download, FileText, GitBranch, Send } from 'lucide-react';
import { getFileVersions, getFileFeedback } from '../services/firestoreService';
import { downloadEncryptedFile } from '../services/storageService';
import { decryptFile } from '../services/encryptionService';
import { saveAs } from 'file-saver';

const WORKFLOW_EVENTS = {
  'DRAFT': { icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Created as Draft' },
  'PENDING_HOS_REVIEW': { icon: Send, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Submitted for HOS Review' },
  'NEEDS_REVISION': { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Revision Requested' },
  'PENDING_EXAM_UNIT': { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Pending Exam Unit Approval' },
  'APPROVED': { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Approved' }
};

export default function FileTimelineModal({ file, onClose }) {
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [downloading, setDownloading] = useState({});
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    loadTimeline();
  }, [file.id]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const [versionsData, feedbackData] = await Promise.all([
        getFileVersions(file.id),
        getFileFeedback(file.id)
      ]);

      setVersions(versionsData);
      setFeedback(feedbackData);

      // Build timeline from versions and feedback
      const timelineEvents = [];

      // Add version events
      versionsData.forEach(version => {
        timelineEvents.push({
          type: 'version',
          timestamp: version.uploadedAt?.toDate() || new Date(),
          version: version.version,
          data: version
        });
      });

      // Add feedback events
      feedbackData.forEach(fb => {
        timelineEvents.push({
          type: 'feedback',
          timestamp: fb.createdAt?.toDate() || new Date(),
          data: fb
        });
      });

      // Sort by timestamp (newest first)
      timelineEvents.sort((a, b) => b.timestamp - a.timestamp);
      setTimeline(timelineEvents);
    } catch (err) {
      console.error('Error loading timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVersion = async (version) => {
    try {
      setDownloading(prev => ({ ...prev, [version.version]: true }));

      // Download encrypted file
      const encryptedData = await downloadEncryptedFile(version.downloadURL);

      // Decrypt file
      const decryptedBlob = await decryptFile(encryptedData, version.encryptionKey);

      // Save file
      saveAs(decryptedBlob, version.fileName);
    } catch (err) {
      console.error('Error downloading version:', err);
      alert('Failed to download version');
    } finally {
      setDownloading(prev => ({ ...prev, [version.version]: false }));
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-blue-600" />
              File Timeline & History
            </h3>
            <p className="text-sm text-gray-600 mt-1">{file.fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No timeline events yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {timeline.map((event, idx) => (
                <div key={idx} className="flex gap-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      event.type === 'version' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {event.type === 'version' ? (
                        <FileText className={`w-5 h-5 ${
                          event.type === 'version' ? 'text-blue-600' : 'text-purple-600'
                        }`} />
                      ) : (
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    {idx < timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 pb-6">
                    {event.type === 'version' ? (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              Version {event.data.version}
                              {event.version === file.version && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  Current
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{event.data.description || 'No description'}</p>
                          </div>
                          <button
                            onClick={() => handleDownloadVersion(event.data)}
                            disabled={downloading[event.data.version]}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1 disabled:bg-blue-400"
                          >
                            {downloading[event.data.version] ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3" />
                                Download
                              </>
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {event.data.uploadedByName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(event.timestamp)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {formatFileSize(event.data.fileSize)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className={`border-2 rounded-lg p-4 ${
                        event.data.status === 'approved' 
                          ? 'bg-green-50 border-green-200' 
                          : event.data.status === 'rejected'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-start gap-2 mb-2">
                          {event.data.status === 'approved' ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : event.data.status === 'rejected' ? (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <MessageSquare className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <h4 className={`font-semibold ${
                              event.data.status === 'approved' 
                                ? 'text-green-900' 
                                : event.data.status === 'rejected'
                                ? 'text-red-900'
                                : 'text-yellow-900'
                            }`}>
                              {event.data.status === 'approved' && 'Approved'}
                              {event.data.status === 'rejected' && 'Revision Requested'}
                              {!event.data.status && 'Feedback'}
                            </h4>
                            {event.data.comments && (
                              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                                {event.data.comments}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600 mt-3">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {event.data.reviewerName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-gray-600">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {versions.length} version{versions.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {feedback.length} feedback
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

