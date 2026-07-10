import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { MentorshipService } from '../../services/mentorship';
import { LoadingScreen } from '../../components/common';
import type { MentorshipRequestWithLearner } from '../../types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  completed: 'bg-primary-50 text-primary-700 border-primary-200',
};

const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ Pending',
  accepted: '✅ Accepted',
  rejected: '✗ Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="h-10 w-10 rounded-full object-cover" />;
  }
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
      {initials}
    </div>
  );
}

export default function MentorRequestsPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<MentorshipRequestWithLearner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // requestId being actioned
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    const res = await MentorshipService.getReceivedRequests(user.id);
    if (res.error) setError(res.error);
    else setRequests(res.data ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!user?.id) return;
    setActionLoading(requestId);
    setActionError(null);
    const res = await MentorshipService.updateRequestStatus(requestId, status, user.id);
    if (res.error) {
      setActionError(res.error);
    } else {
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r)),
      );
    }
    setActionLoading(null);
  };

  if (profileLoading) return <LoadingScreen />;

  if (profile?.role !== 'mentor') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-4xl mb-3">🔒</p>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Mentors Only</h2>
        <p className="text-sm text-gray-500 mb-5">
          This page is only accessible to users with the Mentor role.
        </p>
        <button onClick={() => navigate('/mentorship')} className="text-sm text-primary hover:underline cursor-pointer">
          ← Back to Mentorship
        </button>
      </div>
    );
  }

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-primary-900 to-primary-700 p-6 text-white shadow-sm relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center pr-10 text-9xl">📬</div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => navigate('/mentorship')} className="text-primary-200 hover:text-white text-sm cursor-pointer">
              ← Mentorship
            </button>
          </div>
          <h1 className="text-2xl font-bold">Mentorship Requests</h1>
          <p className="mt-1 text-sm text-primary-200">
            {pendingCount > 0
              ? `You have ${pendingCount} pending request${pendingCount > 1 ? 's' : ''} awaiting your response.`
              : 'No pending requests at the moment.'}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2 flex-wrap">
        {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-700'
            }`}
          >
            {f === 'all' ? `All (${requests.length})` : `${STATUS_LABEL[f]} (${requests.filter((r) => r.status === f).length})`}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-2 text-red-500 hover:underline cursor-pointer text-xs">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
          <button onClick={load} className="ml-2 font-semibold underline cursor-pointer">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-semibold text-gray-700">No {filter !== 'all' ? filter : ''} requests found</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === 'all'
              ? 'Learners who match your profile will be able to send you requests.'
              : `You have no ${filter} requests at the moment.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const l = req.learner;
            const degree = l?.qualification_other ?? l?.qualification;
            const isPending = req.status === 'pending';
            const isActioning = actionLoading === req.id;

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <Avatar name={l?.full_name ?? 'Learner'} avatarUrl={l?.avatar_url} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">
                          {l?.full_name ?? 'Unknown Learner'}
                        </h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-500">
                          {l?.occupation && <span>💼 {l.occupation}</span>}
                          {l?.company && <span>🏢 {l.company}</span>}
                          {l?.experience != null && <span>⏱ {l.experience}yr exp</span>}
                          {(l?.city || l?.state) && (
                            <span>📍 {[l?.city, l?.state].filter(Boolean).join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[req.status]}`}>
                        {STATUS_LABEL[req.status]}
                      </span>
                    </div>

                    {/* Academic info */}
                    {(degree || l?.specialization) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {degree && (
                          <span className="rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                            🎓 {degree}
                          </span>
                        )}
                        {l?.specialization && (
                          <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                            {l.specialization}
                          </span>
                        )}
                        {l?.age && (
                          <span className="rounded-md bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                            Age {l.age}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bio */}
                    {l?.bio && (
                      <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">{l.bio}</p>
                    )}

                    {/* Request message */}
                    {req.message && (
                      <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Message</p>
                        <p className="text-xs text-gray-700 italic">"{req.message}"</p>
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="mt-2 text-[10px] text-gray-400">
                      Requested {new Date(req.requested_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                      {req.responded_at && ` · Responded ${new Date(req.responded_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}`}
                    </p>

                    {/* Actions — only for pending requests */}
                    {isPending && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleAction(req.id, 'accepted')}
                          disabled={isActioning}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors cursor-pointer"
                        >
                          {isActioning ? '…' : '✓ Accept'}
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'rejected')}
                          disabled={isActioning}
                          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors cursor-pointer"
                        >
                          {isActioning ? '…' : '✗ Decline'}
                        </button>
                        <button
                          onClick={() => navigate(`/mentorship/mentor/${req.learner_id}`)}
                          className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          View Profile
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
