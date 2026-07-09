import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthService } from '../../services/auth';
import { ErrorMessage } from '../../components/common';
import { ROUTES } from '../../constants';

export default function SettingsPage() {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    const result = await AuthService.deleteAccount();
    setDeleting(false);
    if (result.error) {
      setDeleteError(result.error);
    } else {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Settings</h1>

      {/* Theme */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-1 font-semibold text-gray-800">Theme</h2>
        <p className="mb-3 text-sm text-gray-500">Toggle between light and dark mode.</p>
        <button
          onClick={toggleTheme}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Current: <span className="capitalize font-semibold">{theme}</span> — Switch to{' '}
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
        <p className="mt-2 text-xs text-gray-400">
          Full theme redesign will be available in a future update.
        </p>
      </section>

      {/* Sign Out */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-1 font-semibold text-gray-800">Sign Out</h2>
        <p className="mb-3 text-sm text-gray-500">Sign out of your account on this device.</p>
        <button
          onClick={handleSignOut}
          className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
        >
          Sign Out
        </button>
      </section>

      {/* Delete Account */}
      <section className="rounded-lg border border-red-200 bg-white p-5">
        <h2 className="mb-1 font-semibold text-red-700">Delete Account</h2>
        <p className="mb-3 text-sm text-gray-500">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        <ErrorMessage message={deleteError} className="mb-3" />

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-md border border-red-400 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-700">
              Are you sure? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-md bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
