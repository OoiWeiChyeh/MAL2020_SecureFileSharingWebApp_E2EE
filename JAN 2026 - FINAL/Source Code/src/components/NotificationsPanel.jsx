import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Info, CheckCircle, Trash2, Mail, MailCheck, Filter } from 'lucide-react';
import { getCurrentUser } from '../services/authService';
import {
  getNotificationsForUser as getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount
} from '../services/notificationService';
import {
  deleteNotification,
  clearAllNotifications,
  clearReadNotifications
} from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPanel() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'approval', 'rejection', 'review_request', 'feedback', 'role_assigned', 'new_user_pending', 'user_approved'

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const [notifs, count] = await Promise.all([
        getUserNotifications(user.uid),
        getUnreadNotificationCount(user.uid)
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      await loadNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      setLoading(true);
      await markAllNotificationsAsRead(user.uid);
      await loadNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation(); // Prevent notification click
    try {
      await deleteNotification(notificationId);
      await loadNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    const user = getCurrentUser();
    if (!user) return;

    if (!window.confirm('Delete all notifications? This cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const count = await clearAllNotifications(user.uid);
      await loadNotifications();
      alert(`Cleared ${count} notification${count !== 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Error clearing all notifications:', err);
      alert('Failed to clear notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleClearRead = async () => {
    const user = getCurrentUser();
    if (!user) return;

    if (!window.confirm('Delete all read notifications?')) {
      return;
    }

    try {
      setLoading(true);
      const count = await clearReadNotifications(user.uid);
      await loadNotifications();
      if (count > 0) {
        alert(`Cleared ${count} read notification${count !== 1 ? 's' : ''}`);
      } else {
        alert('No read notifications to clear');
      }
    } catch (err) {
      console.error('Error clearing read notifications:', err);
      alert('Failed to clear read notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'approval':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejection':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'review_request':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'feedback':
        return <Info className="w-5 h-5 text-purple-600" />;
      case 'role_assigned':
      case 'user_approved':
        return <CheckCircle className="w-5 h-5 text-indigo-600" />;
      case 'new_user_pending':
        return <Bell className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Group notifications by date
  const groupNotificationsByDate = (notifs) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    notifs.forEach(notif => {
      const notifDate = notif.createdAt?.toDate ? notif.createdAt.toDate() : new Date(notif.createdAt);
      const notifDateOnly = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      if (notifDateOnly.getTime() === today.getTime()) {
        groups.today.push(notif);
      } else if (notifDateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notif);
      } else if (notifDate >= thisWeek) {
        groups.thisWeek.push(notif);
      } else {
        groups.older.push(notif);
      }
    });

    return groups;
  };

  // Filter notifications by type
  const filteredNotifications = notifications.filter(notif => {
    if (filterType === 'all') return true;
    return notif.type === filterType;
  });

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-t-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-1 flex-wrap mb-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${filterType === 'all'
                      ? 'bg-white text-blue-700'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('approval')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${filterType === 'approval'
                      ? 'bg-white text-green-700'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  Approvals
                </button>
                <button
                  onClick={() => setFilterType('rejection')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${filterType === 'rejection'
                      ? 'bg-white text-red-700'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  Rejections
                </button>
                <button
                  onClick={() => setFilterType('review_request')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${filterType === 'review_request'
                      ? 'bg-white text-blue-700'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  Reviews
                </button>
                <button
                  onClick={() => setFilterType('feedback')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${filterType === 'feedback'
                      ? 'bg-white text-purple-700'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  Feedback
                </button>
                <button
                  onClick={() => setFilterType('role_assigned')}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${filterType === 'role_assigned'
                      ? 'bg-white text-indigo-700'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  Role Updates
                </button>
              </div>

              {/* Action Buttons */}
              {notifications.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={loading}
                      className="text-xs text-white hover:text-blue-100 font-medium px-2 py-1 rounded hover:bg-white/20 transition-colors"
                    >
                      ✓ Mark all read
                    </button>
                  )}
                  <button
                    onClick={handleClearRead}
                    disabled={loading}
                    className="text-xs text-white hover:text-blue-100 font-medium px-2 py-1 rounded hover:bg-white/20 transition-colors"
                  >
                    Clear read
                  </button>
                  <button
                    onClick={handleClearAll}
                    disabled={loading}
                    className="text-xs text-white hover:text-blue-100 font-medium px-2 py-1 rounded hover:bg-white/20 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {notifications.length === 0 ? 'No notifications' : 'No notifications match this filter'}
                  </p>
                </div>
              ) : (
                <div>
                  {/* Today */}
                  {groupedNotifications.today.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-700">Today</p>
                      </div>
                      {groupedNotifications.today.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          onDelete={handleDeleteNotification}
                          onClick={handleNotificationClick}
                          getIcon={getNotificationIcon}
                          formatTime={formatTime}
                        />
                      ))}
                    </div>
                  )}

                  {/* Yesterday */}
                  {groupedNotifications.yesterday.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-700">Yesterday</p>
                      </div>
                      {groupedNotifications.yesterday.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          onDelete={handleDeleteNotification}
                          onClick={handleNotificationClick}
                          getIcon={getNotificationIcon}
                          formatTime={formatTime}
                        />
                      ))}
                    </div>
                  )}

                  {/* This Week */}
                  {groupedNotifications.thisWeek.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-700">This Week</p>
                      </div>
                      {groupedNotifications.thisWeek.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          onDelete={handleDeleteNotification}
                          onClick={handleNotificationClick}
                          getIcon={getNotificationIcon}
                          formatTime={formatTime}
                        />
                      ))}
                    </div>
                  )}

                  {/* Older */}
                  {groupedNotifications.older.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-700">Older</p>
                      </div>
                      {groupedNotifications.older.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          onDelete={handleDeleteNotification}
                          onClick={handleNotificationClick}
                          getIcon={getNotificationIcon}
                          formatTime={formatTime}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Notification Item Component
function NotificationItem({ notification, onMarkAsRead, onDelete, onClick, getIcon, formatTime }) {
  return (
    <div
      onClick={() => onClick(notification)}
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${!notification.read ? 'bg-blue-50/50' : ''
        }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
              {notification.title}
            </p>
            {notification.emailSent && (
              <MailCheck className="w-4 h-4 text-green-600 flex-shrink-0" title="Email sent" />
            )}
            {notification.emailSent === false && notification.emailError && (
              <Mail className="w-4 h-4 text-red-500 flex-shrink-0" title="Email failed" />
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500">
              {formatTime(notification.createdAt)}
            </p>
            {!notification.read && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs font-bold rounded">
                NEW
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!notification.read && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="flex-shrink-0 p-1 hover:bg-gray-200 rounded"
              title="Mark as read"
            >
              <Check className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <button
            onClick={(e) => onDelete(notification.id, e)}
            className="flex-shrink-0 p-1 hover:bg-red-100 rounded"
            title="Delete notification"
          >
            <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
