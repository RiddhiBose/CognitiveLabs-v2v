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
      // Roll back if error
      setPrefs((prev: any) => ({ ...prev, [field]: !updatedValue }));
      setPrefsError(res.error);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 text-white shadow-xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-primary-100">Manage your account preferences</p>
      </div>

      <div className="space-y-6">
        {/* Theme */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <h2 className="mb-1 font-bold text-gray-800 text-lg">Theme</h2>
          <p className="mb-4 text-sm text-gray-500">Toggle between light and dark mode.</p>
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
          >
            Current: <span className="capitalize">{theme}</span> — Switch to {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <p className="mt-2 text-xs text-gray-400">
            Full theme redesign will be available in a future update.
          </p>
        </section>

        {/* Notification Preferences */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <h2 className="mb-1 font-bold text-gray-800 text-lg">Notification Preferences</h2>
          <p className="mb-6 text-sm text-gray-500">Choose which updates you would like to receive.</p>

          <ErrorMessage message={prefsError} className="mb-4" />

          {prefsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : !prefs ? (
            <p className="text-sm text-gray-500">Failed to load preferences.</p>
          ) : (
            <div className="space-y-4">
              {/* Scholarship */}
              <div className="flex items-start justify-between p-4 rounded-xl hover:bg-gray-50 transition-all">
                <div className="flex-1 pr-4">
                  <label htmlFor="pref-scholarships" className="text-sm font-bold text-gray-800 block cursor-pointer">
                    Scholarship Updates
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Deadlines, eligibility changes, and application openings.</p>
                </div>
                <input
                  id="pref-scholarships"
                  type="checkbox"
                  checked={prefs.scholarship_updates}
                  onChange={() => handleTogglePref('scholarship_updates')}
                  className="mt-1 h-5 w-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
              </div>

              {/* Loan */}
              <div className="flex items-start justify-between p-4 rounded-xl hover:bg-gray-50 transition-all border-t border-gray-100">
                <div className="flex-1 pr-4">
                  <label htmlFor="pref-loans" className="text-sm font-bold text-gray-800 block cursor-pointer">
                    Education Loan Updates
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Interest rate changes and new loan products.</p>
                </div>
                <input
                  id="pref-loans"
                  type="checkbox"
                  checked={prefs.loan_updates}
                  onChange={() => handleTogglePref('loan_updates')}
                  className="mt-1 h-5 w-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
              </div>

              {/* Schemes */}
              <div className="flex items-start justify-between p-4 rounded-xl hover:bg-gray-50 transition-all border-t border-gray-100">
                <div className="flex-1 pr-4">
                  <label htmlFor="pref-schemes" className="text-sm font-bold text-gray-800 block cursor-pointer">
                    Government Schemes & Startup Updates
                  </label>
                  <p className="text-xs text-gray-500 mt-1">New startup funding schemes and benefits updates.</p>
                </div>
                <input
                  id="pref-schemes"
                  type="checkbox"
                  checked={prefs.government_scheme_updates}
                  onChange={() => handleTogglePref('government_scheme_updates')}
                  className="mt-1 h-5 w-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
              </div>

              {/* Literacy */}
              <div className="flex items-start justify-between p-4 rounded-xl hover:bg-gray-50 transition-all border-t border-gray-100">
                <div className="flex-1 pr-4">
                  <label htmlFor="pref-literacy" className="text-sm font-bold text-gray-800 block cursor-pointer">
                    Financial Literacy Updates
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Course additions, updates, and certification alerts.</p>
                </div>
                <input
                  id="pref-literacy"
                  type="checkbox"
                  checked={prefs.financial_literacy_updates}
                  onChange={() => handleTogglePref('financial_literacy_updates')}
                  className="mt-1 h-5 w-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
              </div>

              {/* Mentorship */}
              <div className="flex items-start justify-between p-4 rounded-xl hover:bg-gray-50 transition-all border-t border-gray-100">
                <div className="flex-1 pr-4">
                  <label htmlFor="pref-mentorship" className="text-sm font-bold text-gray-800 block cursor-pointer">
                    Mentorship Notifications
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Request received, acceptances, and mentor match alerts.</p>
                </div>
                <input
                  id="pref-mentorship"
                  type="checkbox"
                  checked={prefs.mentorship_notifications}
                  onChange={() => handleTogglePref('mentorship_notifications')}
                  className="mt-1 h-5 w-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
              </div>

              {/* Messaging */}
              <div className="flex items-start justify-between p-4 rounded-xl hover:bg-gray-50 transition-all border-t border-gray-100">
                <div className="flex-1 pr-4">
                  <label htmlFor="pref-messages" className="text-sm font-bold text-gray-800 block cursor-pointer">
                    Message Notifications
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Real-time alerts for new direct messages and reminders.</p>
                </div>
                <input
                  id="pref-messages"
                  type="checkbox"
                  checked={prefs.message_notifications}
                  onChange={() => handleTogglePref('message_notifications')}
                  className="mt-1 h-5 w-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </section>

        {/* Sign Out */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <h2 className="mb-1 font-bold text-gray-800 text-lg">Sign Out</h2>
          <p className="mb-4 text-sm text-gray-500">Sign out of your account on this device.</p>
          <button
            onClick={handleSignOut}
            className="rounded-xl bg-gray-800 px-6 py-3 text-sm font-bold text-white hover:bg-gray-900 transition-all"
          >
            Sign Out
          </button>
        </section>

        {/* Delete Account */}
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-lg">
          <h2 className="mb-1 font-bold text-red-700 text-lg">Delete Account</h2>
          <p className="mb-4 text-sm text-gray-500">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          <ErrorMessage message={deleteError} className="mb-4" />

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-xl border border-red-300 bg-red-50 px-6 py-3 text-sm font-bold text-red-700 hover:bg-red-100 transition-all"
            >
              Delete Account
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-bold text-red-700">
                Are you sure? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 transition-all"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
