import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { MentorshipService } from '../../services/mentorship';
import { ChatService } from '../../services/chat';
import { LoadingScreen } from '../../components/common';
import { LearnerPreferenceForm, MentorPreferenceForm, MentorCard, SendRequestModal } from '../../components/mentorship';
import type {
  LearnerPreferences,
  LearnerPreferencesInput,
  MentorPreferences,
  MentorPreferencesInput,
  RankedMentor,
  MentorshipRequest,
} from '../../types';

// ── Loading steps shown while AI is running ──────────────────────────────────
const LOADING_STEPS = [
  'Filtering mentor candidates from database…',
  'Shortlisting top matches…',
  'Running AI compatibility analysis…',
  'Ranking your recommendations…',
];

// ── Learner view ──────────────────────────────────────────────────────────────

function LearnerView() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const [learnerPrefs, setLearnerPrefs] = useState<LearnerPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsSuccess, setPrefsSuccess] = useState(false);
  const [showPrefsForm, setShowPrefsForm] = useState(false);

  const [mentors, setMentors] = useState<RankedMentor[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Request state per mentor
  const [requestStatuses, setRequestStatuses] = useState<Record<string, string>>({});
  const [chatConnectionIds, setChatConnectionIds] = useState<Record<string, string>>({});
  const [requestLoading, setRequestLoading] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [modalMentor, setModalMentor] = useState<RankedMentor | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  // Sent requests list
  const [sentRequests, setSentRequests] = useState<MentorshipRequest[]>([]);

  // Load preferences and sent requests on mount
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setPrefsLoading(true);
      const [prefsRes, sentRes, chatRes] = await Promise.all([
        MentorshipService.getLearnerPreferences(user.id),
        MentorshipService.getSentRequests(user.id),
        ChatService.getConnections(user.id),
      ]);
      if (!prefsRes.error) setLearnerPrefs(prefsRes.data);
      if (!sentRes.error && sentRes.data) {
        const statusMap: Record<string, string> = {};
        for (const req of sentRes.data) statusMap[req.mentor_id] = req.status;
        setRequestStatuses(statusMap);
        setSentRequests(sentRes.data);
      }
      if (!chatRes.error && chatRes.data) {
        const connMap: Record<string, string> = {};
        for (const conn of chatRes.data) connMap[conn.other_user_id] = conn.connection_id;
        setChatConnectionIds(connMap);
      }
      setPrefsLoading(false);

      // Auto-search if preferences already exist
      if (!prefsRes.error && prefsRes.data && profile) {
        runSearch(prefsRes.data);
      } else {
        setShowPrefsForm(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const runSearch = useCallback(async (prefs: LearnerPreferences) => {
    if (!profile) return;
    setSearching(true);
    setSearchError(null);
    setMentors([]);
    setSearchStep(0);

    // Cycle loading steps
    const interval = setInterval(() => {
      setSearchStep((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, 1800);

    const res = await MentorshipService.getRecommendedMentors(profile, prefs);
    clearInterval(interval);
    setSearching(false);

    if (res.error) {
      setSearchError(res.error);
    } else if (!res.data || res.data.length === 0) {
      setSearchError('No mentor matches found for your preferences. Try broadening your criteria.');
    } else {
      setMentors(res.data);
    }
  }, [profile]);

  const handleSavePrefs = async (input: LearnerPreferencesInput) => {
    if (!user?.id) return;
    setPrefsSaving(true);
    setPrefsError(null);
    const res = await MentorshipService.upsertLearnerPreferences(user.id, input);
    setPrefsSaving(false);
    if (res.error) { setPrefsError(res.error); return; }
    setLearnerPrefs(res.data);
    setPrefsSuccess(true);
    setShowPrefsForm(false);
    if (res.data && profile) runSearch(res.data);
  };

  const openRequestModal = (mentor: RankedMentor) => {
    setModalMentor(mentor);
    setRequestError(null);
  };

  const handleConfirmRequest = async (message: string) => {
    if (!user?.id || !modalMentor) return;
    setSendingRequest(true);
    setRequestLoading(modalMentor.user_id);
    const res = await MentorshipService.sendRequest(modalMentor.user_id, user.id, message);
    setSendingRequest(false);
    setRequestLoading(null);
    if (res.error) {
      setRequestError(res.error);
    } else {
      setRequestStatuses((prev) => ({ ...prev, [modalMentor.user_id]: 'pending' }));
      setModalMentor(null);
    }
  };

  if (prefsLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Sent Requests quick view */}
      {sentRequests.length > 0 && (
        <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-primary-800">Your Requests ({sentRequests.length})</p>
            <button
              onClick={() => navigate('/mentorship/requests')}
              className="text-xs text-primary-600 hover:underline cursor-pointer font-semibold"
            >
              View All →
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {sentRequests.slice(0, 5).map((req) => (
              <span
                key={req.id}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                  req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {req.status === 'accepted' ? '✅' : req.status === 'pending' ? '⏳' : '✗'} {req.status}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Preference Form */}
      {(showPrefsForm || !learnerPrefs) && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {learnerPrefs ? 'Update Your Mentor Preferences' : 'Set Your Mentor Preferences'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {learnerPrefs
                  ? 'Adjust your preferences to get refreshed recommendations.'
                  : 'Tell us what kind of mentor you are looking for. You only need to do this once.'}
              </p>
            </div>
            {learnerPrefs && (
              <button
                onClick={() => setShowPrefsForm(false)}
                className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
          {prefsError && (
            <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-xs text-red-700">{prefsError}</p>
          )}
          <LearnerPreferenceForm existing={learnerPrefs} onSave={handleSavePrefs} saving={prefsSaving} />
        </div>
      )}

      {/* Results header when prefs are set but form is hidden */}
      {learnerPrefs && !showPrefsForm && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {searching ? 'Finding your mentors…' : `Recommended Mentors (${mentors.length})`}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Filtered from the database · AI-ranked by compatibility
            </p>
          </div>
          <button
            onClick={() => { setShowPrefsForm(true); setMentors([]); }}
            className="text-xs font-semibold text-primary-600 hover:underline cursor-pointer"
          >
            ✏ Edit Preferences
          </button>
        </div>
      )}

      {/* Prefs saved banner */}
      {prefsSuccess && !showPrefsForm && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 font-medium">
          ✅ Preferences saved! Searching for your best mentor matches…
        </div>
      )}

      {/* Loading state */}
      {searching && (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 shadow-lg flex flex-col items-center justify-center min-h-[360px]">
          <div className="relative flex items-center justify-center mb-6">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
            <span className="absolute text-2xl">🤝</span>
          </div>
          <h3 className="text-base font-bold text-primary-900 animate-pulse">{LOADING_STEPS[searchStep]}</h3>
          <p className="mt-2 text-xs text-gray-400 text-center max-w-xs">
            Our AI analyses profile compatibility — no live internet search required.
          </p>
          <div className="mt-5 flex gap-1.5">
            {LOADING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-all ${i <= searchStep ? 'bg-primary-500' : 'bg-primary-100'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search error */}
      {searchError && !searching && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-bold text-red-800 mb-1">❌ No Results</p>
          <p className="text-xs text-red-700 mb-3">{searchError}</p>
          <button
            onClick={() => { setShowPrefsForm(true); setSearchError(null); }}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer transition-colors"
          >
            Adjust Preferences
          </button>
        </div>
      )}

      {/* Request error */}
      {requestError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          ⚠ {requestError}
          <button onClick={() => setRequestError(null)} className="ml-2 text-xs text-amber-600 hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Mentor cards grid */}
      {!searching && mentors.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {mentors.map((mentor) => (
            <MentorCard
              key={mentor.user_id}
              mentor={mentor}
              onSendRequest={openRequestModal}
              requesting={requestLoading === mentor.user_id}
              requestStatus={requestStatuses[mentor.user_id] ?? null}
              chatConnectionId={chatConnectionIds[mentor.user_id] ?? null}
            />
          ))}
        </div>
      )}

      {/* Send Request Modal */}
      {modalMentor && (
        <SendRequestModal
          mentor={modalMentor}
          onConfirm={handleConfirmRequest}
          onClose={() => { setModalMentor(null); setRequestError(null); }}
          sending={sendingRequest}
        />
      )}
    </div>
  );
}

// ── Mentor view ───────────────────────────────────────────────────────────────

function MentorView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [mentorPrefs, setMentorPrefs] = useState<MentorPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsSuccess, setPrefsSuccess] = useState(false);
  const [showPrefsForm, setShowPrefsForm] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeConnections, setActiveConnections] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setPrefsLoading(true);
      const [prefsRes, requestsRes, connRes] = await Promise.all([
        MentorshipService.getMentorPreferences(user.id),
        MentorshipService.getReceivedRequests(user.id),
        MentorshipService.getActiveRequestsForMentor(user.id),
      ]);
      if (!prefsRes.error) setMentorPrefs(prefsRes.data);
      if (!requestsRes.error) {
        setPendingCount(requestsRes.data?.filter((r) => r.status === 'pending').length ?? 0);
      }
      if (!connRes.error) setActiveConnections(connRes.data ?? 0);
      setPrefsLoading(false);

      // Show form if no preferences set yet
      if (!prefsRes.error && !prefsRes.data) setShowPrefsForm(true);
    })();
  }, [user?.id]);

  const handleSavePrefs = async (input: MentorPreferencesInput) => {
    if (!user?.id) return;
    setPrefsSaving(true);
    setPrefsError(null);
    const res = await MentorshipService.upsertMentorPreferences(user.id, input);
    setPrefsSaving(false);
    if (res.error) { setPrefsError(res.error); return; }
    setMentorPrefs(res.data);
    setPrefsSuccess(true);
    setShowPrefsForm(false);
  };

  if (prefsLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg text-center">
          <p className="text-3xl font-extrabold text-amber-500">{pendingCount}</p>
          <p className="text-xs text-gray-500 font-semibold mt-1">Pending Requests</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg text-center">
          <p className="text-3xl font-extrabold text-emerald-600">{activeConnections}</p>
          <p className="text-xs text-gray-500 font-semibold mt-1">Active Mentees</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-primary-100 bg-primary-50 p-5 text-center">
          <p className="text-3xl font-extrabold text-primary-700">
            {mentorPrefs?.max_active_mentees ?? '—'}
          </p>
          <p className="text-xs text-primary-500 font-semibold mt-1">Max Mentees Limit</p>
        </div>
      </div>

      {/* CTA to review requests */}
      {pendingCount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📬</span>
            <div>
              <p className="text-sm font-bold text-amber-800">
                {pendingCount} pending request{pendingCount > 1 ? 's' : ''} awaiting your response
              </p>
              <p className="text-xs text-amber-600">Review and accept or decline learner requests.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/mentorship/requests')}
            className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors cursor-pointer"
          >
            Review →
          </button>
        </div>
      )}

      {/* Preference Form */}
      {(showPrefsForm || !mentorPrefs) && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {mentorPrefs ? 'Update Your Learner Preferences' : 'Set Your Learner Preferences'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {mentorPrefs
                  ? 'Update what kind of learners you are looking to mentor.'
                  : 'Tell us about the kind of learners you want to mentor. This helps us match you better.'}
              </p>
            </div>
            {mentorPrefs && (
              <button onClick={() => setShowPrefsForm(false)} className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
                Cancel
              </button>
            )}
          </div>
          {prefsError && (
            <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-xs text-red-700">{prefsError}</p>
          )}
          <MentorPreferenceForm existing={mentorPrefs} onSave={handleSavePrefs} saving={prefsSaving} />
        </div>
      )}

      {/* Current preferences summary */}
      {mentorPrefs && !showPrefsForm && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">Your Current Preferences</h2>
            <button
              onClick={() => setShowPrefsForm(true)}
              className="text-xs font-semibold text-primary-600 hover:underline cursor-pointer"
            >
              ✏ Edit
            </button>
          </div>
          {prefsSuccess && (
            <p className="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 font-medium">
              ✅ Preferences saved successfully!
            </p>
          )}
          <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-2 gap-x-6 text-sm">
            {[
              ['Preferred Learner Occupation', mentorPrefs.preferred_learner_occupation ?? 'No preference'],
              ['Age Range', mentorPrefs.preferred_learner_age_min != null || mentorPrefs.preferred_learner_age_max != null
                ? `${mentorPrefs.preferred_learner_age_min ?? '—'} – ${mentorPrefs.preferred_learner_age_max ?? '—'} years`
                : 'No preference'],
              ['Preferred Degree', mentorPrefs.preferred_degree ?? 'No preference'],
              ['Preferred Branch', mentorPrefs.preferred_branch ?? 'No preference'],
              ['Max Active Mentees', String(mentorPrefs.max_active_mentees)],
              ['Communication Language', mentorPrefs.preferred_language],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2 border-b border-gray-50 pb-1 last:border-0">
                <span className="text-gray-400 text-xs">{label}</span>
                <span className="text-gray-800 text-xs font-semibold text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root page ─────────────────────────────────────────────────────────────────

export default function MentorshipPage() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  if (profileLoading) return <LoadingScreen />;

  const isMentor = profile?.role === 'mentor';

  return (
    <div>
      {/* Header Banner */}
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-primary-800 via-primary-700 to-primary-900 p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center pr-10 text-9xl">🤝</div>
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {isMentor ? 'Mentor Dashboard' : 'Find Your Mentor'}
            </h1>
            <p className="mt-2 text-sm text-primary-100">
              {isMentor
                ? 'Manage your learner preferences and review incoming mentorship requests.'
                : 'AI-powered matching that connects you with the most compatible mentors based on your academic background, career goals, and preferences.'}
            </p>
          </div>
          {isMentor && (
            <button
              onClick={() => navigate('/mentorship/requests')}
              className="shrink-0 rounded-xl bg-white/20 hover:bg-white/30 px-4 py-2.5 text-sm font-bold text-white border border-white/30 transition-colors cursor-pointer"
            >
              📬 View Requests
            </button>
          )}
        </div>

        {/* Role badge */}
        <div className="relative z-10 mt-4">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            isMentor ? 'bg-emerald-400/30 text-emerald-100' : 'bg-primary-400/30 text-primary-100'
          }`}>
            {isMentor ? '✦ Mentor' : '✦ Learner'}
          </span>
          <span className="ml-2 text-xs text-primary-300">
            {isMentor
              ? `${profile?.experience ?? 0}+ years of experience · eligible to mentor`
              : 'Looking for guidance · eligible to receive mentorship'}
          </span>
        </div>
      </div>

      {/* How it works — only shown for learners when they haven't searched yet */}
      {!isMentor && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
          {[
            { step: '1', icon: '📝', title: 'Set Preferences', desc: 'Tell us the kind of mentor you want' },
            { step: '2', icon: '🔍', title: 'Supabase Filter', desc: 'We shortlist candidates from the database' },
            { step: '3', icon: '🤖', title: 'AI Analysis', desc: 'AI ranks by compatibility score' },
            { step: '4', icon: '🤝', title: 'Connect', desc: 'Send a request and start your journey' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                {s.step}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{s.icon} {s.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role-specific content */}
      {isMentor ? <MentorView /> : <LearnerView />}
    </div>
  );
}
