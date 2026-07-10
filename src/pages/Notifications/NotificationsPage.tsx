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
  mentorship: 'bg-indigo-50 text-indigo-700 border-indigo-200',
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
      <div className="mb-8">
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
                className={`relative overflow-hidden rounded-xl border bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md ${
                  n.is_read ? 'border-gray-200/80 bg-white/60' : 'border-indigo-150 bg-indigo-50/20'
                }`}
              >
                {/* Unread Left Border Highlight Indicator */}
                {!n.is_read && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-600" />
                )}

                <div className="flex gap-4">
                  {/* Category Icon */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-xl shadow-xs">
                    {icon}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${badgeClass}`}>
                          {cat.replace(/_/g, ' ')}
                        </span>
                        {n.source && (
                          <span className="text-xs font-medium text-gray-500">
                            • {n.source}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>

                    <h3 className={`mt-2 text-sm font-semibold text-gray-900 ${!n.is_read ? 'text-indigo-950 font-bold' : ''}`}>
                      {n.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {n.message}
                    </p>

                    {/* Actions Panel */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100/60 pt-3">
                      <Link
                        to={route}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        View Details <span aria-hidden="true">→</span>
                      </Link>

                      <div className="flex items-center gap-3">
                        {!n.is_read && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
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
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-3 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Stay updated with mentorship requests, messages, and saved recommendation updates.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 hover:text-indigo-600 transition-all cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !hasNotifications ? (
        <div className="rounded-xl border border-gray-150 bg-white p-8 text-center shadow-xs">
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
