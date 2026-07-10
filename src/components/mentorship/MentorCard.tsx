import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSaved } from '../../contexts/SavedContext';
import SavedItemsService from '../../services/SavedItemsService';
import type { RankedMentor } from '../../types';

interface Props {
  mentor: RankedMentor;
  onSendRequest: (mentor: RankedMentor) => void;
  requesting: boolean;
  requestStatus?: string | null;
  chatConnectionId?: string | null;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
    score >= 60 ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
    score >= 40 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${color}`}>
      ✦ {score}% Match
    </span>
  );
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-14 w-14 rounded-full object-cover ring-2 ring-indigo-100"
      />
    );
  }
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white ring-2 ring-indigo-100">
      {initials}
    </div>
  );
}

export default function MentorCard({ mentor, onSendRequest, requesting, requestStatus, chatConnectionId }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { adjustCount } = useSaved();

  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const degree = mentor.qualification_other ?? mentor.qualification ?? null;
  const occupation = mentor.occupation_other ?? mentor.occupation ?? null;

  const handleSaveToggle = async () => {
    if (!user?.id) return;
    setSaving(true);
    if (isSaved) {
      await SavedItemsService.unsave(user.id, 'mentor', mentor.user_id);
      setIsSaved(false);
      adjustCount(-1);
    } else {
      await SavedItemsService.save({
        userId: user.id,
        itemType: 'mentor',
        itemId: mentor.user_id,
        itemTitle: mentor.full_name,
        itemMetadata: {
          qualification: mentor.qualification_other ?? mentor.qualification ?? null,
          specialization: mentor.specialization ?? null,
          occupation: mentor.occupation_other ?? mentor.occupation ?? null,
          job_title: mentor.job_title ?? null,
          company: mentor.company ?? null,
          experience: mentor.experience ?? null,
          state: mentor.state ?? null,
          city: mentor.city ?? null,
          bio: mentor.bio ?? null,
          compatibilityScore: mentor.compatibilityScore,
          reasons: mentor.reasons,
        },
        snapshot: mentor as unknown as Record<string, unknown>,
      });
      setIsSaved(true);
      adjustCount(1);
    }
    setSaving(false);
  };

  const requestButtonLabel = () => {
    if (requesting) return 'Sending…';
    if (requestStatus === 'pending') return '⏳ Request Pending';
    if (requestStatus === 'accepted') return '✅ Connected';
    if (requestStatus === 'rejected') return 'Request Again';
    return 'Send Mentorship Request';
  };

  const requestButtonDisabled = requesting || requestStatus === 'pending' || requestStatus === 'accepted';

  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar name={mentor.full_name} avatarUrl={mentor.avatar_url} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">{mentor.full_name}</h3>
              {mentor.job_title && (
                <p className="text-sm text-indigo-600 font-medium mt-0.5">{mentor.job_title}</p>
              )}
            </div>
            <ScoreBadge score={mentor.compatibilityScore} />
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
            {occupation && <span>💼 {occupation}</span>}
            {mentor.company && <span>🏢 {mentor.company}</span>}
            {mentor.experience != null && <span>⏱ {mentor.experience}yr exp</span>}
            {(mentor.state || mentor.city) && (
              <span>📍 {[mentor.city, mentor.state].filter(Boolean).join(', ')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Academic */}
      {(degree || mentor.specialization) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {degree && (
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
              🎓 {degree}
            </span>
          )}
          {mentor.specialization && (
            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
              {mentor.specialization}
            </span>
          )}
        </div>
      )}

      {/* Bio */}
      {mentor.bio && (
        <p className="mb-3 text-xs text-gray-500 leading-relaxed line-clamp-3">{mentor.bio}</p>
      )}

      {/* Match Reasons */}
      {mentor.reasons.length > 0 && (
        <div className="mb-4 rounded-xl bg-indigo-50/60 border border-indigo-100 px-3 py-2.5">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-500">
            Why this mentor
          </p>
          <ul className="space-y-1">
            {mentor.reasons.slice(0, 4).map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-indigo-800">
                <span className="mt-0.5 shrink-0 text-indigo-400">✓</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <button
          onClick={() => navigate(`/mentorship/mentor/${mentor.user_id}`)}
          className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
        >
          View Profile
        </button>
        <button
          onClick={handleSaveToggle}
          disabled={saving}
          aria-label={isSaved ? 'Remove from saved' : 'Save mentor'}
          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
            isSaved
              ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
              : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-200 hover:text-indigo-600'
          }`}
        >
          {isSaved ? '❤️' : '♡'}
        </button>
        {requestStatus === 'accepted' && chatConnectionId ? (
          <button
            onClick={() => navigate(`/chat/${chatConnectionId}`)}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            💬 Message
          </button>
        ) : (
          <button
            onClick={() => onSendRequest(mentor)}
            disabled={requestButtonDisabled}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {requestButtonLabel()}
          </button>
        )}
      </div>
    </div>
  );
}
