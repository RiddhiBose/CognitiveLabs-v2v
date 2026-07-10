import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthService } from '../../services/auth';
import { ErrorMessage, Spinner } from '../../components/common';
import { ROUTES } from '../../constants';
import NotificationService from '../../services/notification/notificationService';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
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

  // Notification Preferences State
  const [prefs, setPrefs] = useState<any>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    async function loadPrefs() {
      const res = await NotificationService.getPreferences(user!.id);
      if (res.error) {
        setPrefsError(res.error);
      } else {
        setPrefs(res.data);
      }
      setPrefsLoading(false);
    }
    loadPrefs();
  }, [user?.id]);

  const handleTogglePref = async (field: string) => {
    if (!user?.id || !prefs) return;
    const updatedValue = !prefs[field];
    
    // Optimistic Update
    setPrefs((prev: any) => ({ ...prev, [field]: updatedValue }));
    setPrefsError(null);

    const res = await NotificationService.updatePreferences(user.id, { [field]: updatedValue });
    if (res.error) {
      // Revert if error
      setPrefs((prev: any) => ({ ...prev, [field]: !updatedValue }));
      setPrefsError(res.error);
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

      {/* Notification Preferences */}
      <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-1 font-semibold text-gray-800">Notification Preferences</h2>
        <p className="mb-4 text-sm text-gray-500">Choose which updates you would like to receive.</p>

        <ErrorMessage message={prefsError} className="mb-4" />

        {prefsLoading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : !prefs ? (
          <p className="text-sm text-gray-500">Failed to load preferences.</p>
        ) : (
          <div className="space-y-4">
            {/* Scholarship */}
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <label htmlFor="pref-scholarships" className="text-sm font-medium text-gray-800 block cursor-pointer">
                  Scholarship Updates
                </label>
                <span className="text-xs text-gray-500">Deadlines, eligibility changes, and application openings.</span>
              </div>
              <input
                id="pref-scholarships"
                type="checkbox"
                checked={prefs.scholarship_updates}
                onChange={() => handleTogglePref('scholarship_updates')}
                className="mt-1 h-4 w-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Loan */}
            <div className="flex items-start justify-between border-t border-gray-100 pt-3">
              <div className="flex-1 pr-4">
                <label htmlFor="pref-loans" className="text-sm font-medium text-gray-800 block cursor-pointer">
                  Education Loan Updates
                </label>
                <span className="text-xs text-gray-500">Interest rate changes and new loan products.</span>
              </div>
              <input
                id="pref-loans"
                type="checkbox"
                checked={prefs.loan_updates}
                onChange={() => handleTogglePref('loan_updates')}
                className="mt-1 h-4 w-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Schemes */}
            <div className="flex items-start justify-between border-t border-gray-100 pt-3">
              <div className="flex-1 pr-4">
                <label htmlFor="pref-schemes" className="text-sm font-medium text-gray-800 block cursor-pointer">
                  Government Schemes & Startup Updates
                </label>
                <span className="text-xs text-gray-500">New startup funding schemes and benefits updates.</span>
              </div>
              <input
                id="pref-schemes"
                type="checkbox"
                checked={prefs.government_scheme_updates}
                onChange={() => handleTogglePref('government_scheme_updates')}
                className="mt-1 h-4 w-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Literacy */}
            <div className="flex items-start justify-between border-t border-gray-100 pt-3">
              <div className="flex-1 pr-4">
                <label htmlFor="pref-literacy" className="text-sm font-medium text-gray-800 block cursor-pointer">
                  Financial Literacy Updates
                </label>
                <span className="text-xs text-gray-500">Course additions, updates, and certification alerts.</span>
              </div>
              <input
                id="pref-literacy"
                type="checkbox"
                checked={prefs.financial_literacy_updates}
                onChange={() => handleTogglePref('financial_literacy_updates')}
                className="mt-1 h-4 w-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Mentorship */}
            <div className="flex items-start justify-between border-t border-gray-100 pt-3">
              <div className="flex-1 pr-4">
                <label htmlFor="pref-mentorship" className="text-sm font-medium text-gray-800 block cursor-pointer">
                  Mentorship Notifications
                </label>
                <span className="text-xs text-gray-500">Request received, acceptances, and mentor match alerts.</span>
              </div>
              <input
                id="pref-mentorship"
                type="checkbox"
                checked={prefs.mentorship_notifications}
                onChange={() => handleTogglePref('mentorship_notifications')}
                className="mt-1 h-4 w-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Messaging */}
            <div className="flex items-start justify-between border-t border-gray-100 pt-3">
              <div className="flex-1 pr-4">
                <label htmlFor="pref-messages" className="text-sm font-medium text-gray-800 block cursor-pointer">
                  Message Notifications
                </label>
                <span className="text-xs text-gray-500">Real-time alerts for new direct messages and reminders.</span>
              </div>
              <input
                id="pref-messages"
                type="checkbox"
                checked={prefs.message_notifications}
                onChange={() => handleTogglePref('message_notifications')}
                className="mt-1 h-4 w-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        )}
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
