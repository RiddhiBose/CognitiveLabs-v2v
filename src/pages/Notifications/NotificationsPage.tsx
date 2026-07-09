import { useNotifications } from '../../contexts/NotificationContext';
import { EmptyState, Spinner } from '../../components/common';
import { timeAgo } from '../../utils/dateFormatter';

export default function NotificationsPage() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-sm font-medium text-red-700">
              {unreadCount} new
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-indigo-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <EmptyState message="No notifications." description="You are all caught up!" />
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border p-4 ${
                n.is_read ? 'border-gray-200 bg-white' : 'border-indigo-200 bg-indigo-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{n.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="shrink-0 text-xs text-indigo-600 hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
