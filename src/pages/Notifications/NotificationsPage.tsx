import { useNotifications } from '../../contexts/NotificationContext';
import { EmptyState, Spinner } from '../../components/common';
import { timeAgo } from '../../utils/dateFormatter';
import type { Notification } from '../../types';
import { Link } from 'react-router-dom';

// Custom icons for notification categories
const CATEGORY_ICONS: Record<string, string> = {
  scholarship: '🎓',
  loan: '💰',
  education_loan: '💰',
  government_scheme: '🏛️',
  startup_funding: '🚀',
  financial_literacy: '📘',
  college: '🏫',
  mentorship: '🤝',
  messaging: '💬',
  system: '📢',
  general: '🔔',
};

// Custom color styling for category badges
const CATEGORY_STYLES: Record<string, string> = {
  scholarship: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  loan: 'bg-amber-50 text-amber-700 border-amber-200',
  education_loan: 'bg-amber-50 text-amber-700 border-amber-200',
  government_scheme: 'bg-purple-50 text-purple-700 border-purple-200',
  startup_funding: 'bg-blue-50 text-blue-700 border-blue-200',
  financial_literacy: 'bg-teal-50 text-teal-700 border-teal-200',
  college: 'bg-rose-50 text-rose-700 border-rose-200',
  mentorship: 'bg-primary-50 text-primary-700 border-primary-200',
  messaging: 'bg-sky-50 text-sky-700 border-sky-200',
  system: 'bg-gray-100 text-gray-700 border-gray-300',
  general: 'bg-gray-50 text-gray-700 border-gray-200',
};

function getNotificationRoute(notification: Notification) {
  const type = notification.type;
  const relId = notification.related_id;

  if (type === 'message_received' || type === 'unread_message') {
    return relId ? `/chat/${relId}` : '/chat';
  }
  if (type.startsWith('mentorship_')) {
    if (type === 'mentorship_request') {
      return '/mentorship/requests';
    }
    return '/mentorship';
  }
  if (type === 'recommendation_update') {
    return '/saved';
  }
  return '/dashboard';
}

function groupNotifications(notifications: Notification[]) {
  const groups: { Today: Notification[]; Yesterday: Notification[]; Earlier: Notification[] } = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  notifications.forEach((n) => {
    const date = new Date(n.created_at);
    if (date >= today) {
      groups.Today.push(n);
    } else if (date >= yesterday) {
      groups.Yesterday.push(n);
    } else {
      groups.Earlier.push(n);
    }
  });

  return groups;
}

export default function NotificationsPage() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const groups = groupNotifications(notifications);
  const hasNotifications = notifications.length > 0;

  const renderGroup = (title: string, groupNotifications: Notification[]) => {
    if (groupNotifications.length === 0) return null;

    return (
      <div key={title} className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">{title}</h2>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <ul className="space-y-4">
          {groupNotifications.map((n) => {
            const cat = n.category || 'general';
            const icon = CATEGORY_ICONS[cat] || '🔔';
            const badgeClass = CATEGORY_STYLES[cat] || 'bg-gray-50 text-gray-700 border-gray-200';
            const route = getNotificationRoute(n);

            return (
              <li
                key={n.id}
                className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${
                  n.is_read ? 'border-gray-100' : 'border-primary-100 bg-primary-50/10'
                }`}
              >
                {/* Unread Left Border Highlight Indicator */}
                {!n.is_read && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-primary-600 to-primary-800" />
                )}

                <div className="flex gap-4">
                  {/* Category Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 text-2xl">
                    {icon}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-xl border px-3 py-1 text-xs font-bold uppercase tracking-wider ${badgeClass}`}>
                          {cat.replace(/_/g, ' ')}
                        </span>
                        {n.source && (
                          <span className="text-xs font-medium text-gray-500">
                            • {n.source}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-bold">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>

                    <h3 className={`mt-3 text-base font-bold text-gray-900 ${!n.is_read ? 'text-primary-900' : ''}`}>
                      {n.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {n.message}
                    </p>

                    {/* Actions Panel */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-3">
                      <Link
                        to={route}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors"
                      >
                        View Details <span aria-hidden="true">→</span>
                      </Link>

                      <div className="flex items-center gap-3">
                        {!n.is_read && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-primary-700 bg-primary-100 hover:bg-primary-200 transition-colors"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
                          aria-label="Delete Notification"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-3 inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="mt-2 text-sm text-primary-100">
              Stay updated with your opportunities and messages
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="rounded-xl bg-white/20 hover:bg-white/30 px-5 py-3 text-sm font-bold text-white transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !hasNotifications ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-14 text-center shadow-lg">
          <EmptyState
            message="No notifications"
            description="You are all caught up! New updates, messages, and opportunities will appear here."
          />
        </div>
      ) : (
        <div>
          {renderGroup('Today', groups.Today)}
          {renderGroup('Yesterday', groups.Yesterday)}
          {renderGroup('Earlier', groups.Earlier)}
        </div>
      )}
    </div>
  );
}
