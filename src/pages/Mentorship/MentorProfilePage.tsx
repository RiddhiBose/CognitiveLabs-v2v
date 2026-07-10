import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { MentorshipService } from '../../services/mentorship';
import { ChatService } from '../../services/chat';
import { LoadingScreen } from '../../components/common';
import { SendRequestModal } from '../../components/mentorship';
import type { MentorCandidate, MentorPreferences, RankedMentor, MentorshipRequest } from '../../types';

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="h-24 w-24 rounded-full object-cover ring-4 ring-primary-100" />;
  }
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-white ring-4 ring-primary-100">
      {initials}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="mt-0.5 text-base">{icon}</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export default function MentorProfilePage() {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();

  const [mentor, setMentor] = useState<(MentorCandidate & { mentor_preferences: MentorPreferences | null }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingRequest, setExistingRequest] = useState<MentorshipRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [chatConnectionId, setChatConnectionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!mentorId) return;
    setLoading(true);
    setError(null);
    const res = await MentorshipService.getMentorProfile(mentorId);
    if (res.error || !res.data) {
      setError(res.error ?? 'Mentor not found.');
    } else {
      setMentor(res.data);
      // Check for existing request and active chat connection if viewer is a learner
      if (user?.id && profile?.role === 'learner') {
        const [reqRes, connRes] = await Promise.all([
          MentorshipService.getExistingRequest(mentorId, user.id),
          ChatService.getConnectionId(user.id, mentorId),
        ]);
        if (!reqRes.error && reqRes.data) setExistingRequest(reqRes.data);
        if (!connRes.error && connRes.data) setChatConnectionId(connRes.data);
      }
    }
    setLoading(false);
  }, [mentorId, user?.id, profile?.role]);

  useEffect(() => { load(); }, [load]);

  const handleSendRequest = async (message: string) => {
    if (!user?.id || !mentorId) return;
    setSending(true);
    setSendError(null);
    const res = await MentorshipService.sendRequest(mentorId, user.id, message);
    setSending(false);
    if (res.error) {
      setSendError(res.error);
    } else {
      setShowModal(false);
      setSendSuccess(true);
      setExistingRequest(res.data);
    }
  };

  if (loading) return <LoadingScreen />;

  if (error || !mentor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-2xl mb-2">😕</p>
        <p className="text-gray-600 font-medium">{error ?? 'Mentor not found.'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm text-indigo-600 hover:underline cursor-pointer">
          ← Go back
        </button>
      </div>
    );
  }

  const degree = mentor.qualification_other ?? mentor.qualification;
  const occupation = mentor.occupation_other ?? mentor.occupation;
  const mp = mentor.mentor_preferences;
  const isOwnProfile = user?.id === mentor.user_id;
  const isLearner = profile?.role === 'learner';
  const requestStatus = existingRequest?.status ?? null;

  const requestButtonLabel = () => {
    if (requestStatus === 'pending') return '⏳ Request Pending';
    if (requestStatus === 'accepted') return '✅ Connected';
    if (requestStatus === 'rejected' || requestStatus === 'cancelled') return 'Send New Request';
    return 'Send Mentorship Request';
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="mb-5 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline cursor-pointer"
      >
        ← Back to Mentors
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Identity card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm text-center">
            <div className="flex justify-center mb-4">
              <Avatar name={mentor.full_name} avatarUrl={mentor.avatar_url} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{mentor.full_name}</h1>
            {mentor.job_title && (
              <p className="mt-1 text-sm font-medium text-indigo-600">{mentor.job_title}</p>
            )}
            {occupation && (
              <p className="mt-0.5 text-xs text-gray-500">{occupation}</p>
            )}
            {mentor.company && (
              <p className="mt-0.5 text-xs font-semibold text-gray-700">🏢 {mentor.company}</p>
            )}
            {(mentor.city || mentor.state) && (
              <p className="mt-1 text-xs text-gray-400">
                📍 {[mentor.city, mentor.state].filter(Boolean).join(', ')}
              </p>
            )}

            {/* CTA */}
            {!isOwnProfile && isLearner && (
              <div className="mt-5 space-y-2">
                {sendSuccess && (
                  <p className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 font-medium">
                    ✅ Request sent successfully!
                  </p>
                )}
                {sendError && (
                  <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                    {sendError}
                  </p>
                )}
                {chatConnectionId && (
                  <button
                    onClick={() => navigate(`/chat/${chatConnectionId}`)}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    💬 Message
                  </button>
                )}
                <button
                  onClick={() => setShowModal(true)}
                  disabled={requestStatus === 'pending' || requestStatus === 'accepted'}
                  className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {requestButtonLabel()}
                </button>
              </div>
            )}
          </div>

          {/* Experience badge */}
          {mentor.experience != null && (
            <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-center">
              <p className="text-3xl font-extrabold text-primary-700">{mentor.experience}</p>
              <p className="text-xs text-primary-500 font-semibold uppercase tracking-wider">
                Years of Experience
              </p>
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Bio */}
          {mentor.bio && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">About</h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{mentor.bio}</p>
            </div>
          )}

          {/* Academic & Professional */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">Academic & Professional</h2>
            <InfoRow icon="🎓" label="Degree" value={degree} />
            <InfoRow icon="🔬" label="Branch / Specialization" value={mentor.specialization} />
            <InfoRow icon="🏢" label="Company / Organisation" value={mentor.company} />
            <InfoRow icon="💼" label="Occupation" value={occupation} />
            <InfoRow icon="🏷" label="Job Role / Title" value={mentor.job_title} />
            <InfoRow icon="🏭" label="Industry" value={mentor.industry} />
            <InfoRow icon="📍" label="Location" value={[mentor.city, mentor.state].filter(Boolean).join(', ') || null} />
          </div>

          {/* Mentor Preferences */}
          {mp && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
                Who I Want to Mentor
              </h2>
              <InfoRow icon="🎯" label="Preferred Learner Occupation" value={mp.preferred_learner_occupation ?? 'No preference'} />
              <InfoRow
                icon="🔢"
                label="Preferred Learner Age Range"
                value={
                  mp.preferred_learner_age_min != null || mp.preferred_learner_age_max != null
                    ? `${mp.preferred_learner_age_min ?? '—'} to ${mp.preferred_learner_age_max ?? '—'} years`
                    : 'No preference'
                }
              />
              <InfoRow icon="🎓" label="Preferred Learner Degree" value={mp.preferred_degree ?? 'No preference'} />
              <InfoRow icon="🔬" label="Preferred Learner Branch" value={mp.preferred_branch ?? 'No preference'} />
              <InfoRow icon="👥" label="Maximum Active Mentees" value={String(mp.max_active_mentees)} />
              <InfoRow icon="🗣" label="Communication Language" value={mp.preferred_language} />
            </div>
          )}
        </div>
      </div>

      {/* Send Request Modal */}
      {showModal && (
        <SendRequestModal
          mentor={mentor as unknown as RankedMentor}
          onConfirm={handleSendRequest}
          onClose={() => { setShowModal(false); setSendError(null); }}
          sending={sending}
        />
      )}
    </div>
  );
}
