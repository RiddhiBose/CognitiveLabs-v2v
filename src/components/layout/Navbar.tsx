import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { ROUTES, APP_NAME } from '../../constants';

export default function Navbar() {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.LOGIN);
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link to={ROUTES.DASHBOARD} className="text-lg font-bold text-indigo-600">
          {APP_NAME}
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Link
            to={ROUTES.NOTIFICATIONS}
            className="relative text-gray-600 hover:text-indigo-600"
            aria-label="Notifications"
          >
            <span>&#128276;</span>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Profile link */}
          <Link
            to={ROUTES.PROFILE}
            className="text-sm font-medium text-gray-700 hover:text-indigo-600"
          >
            {profile?.full_name ?? 'Profile'}
          </Link>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
