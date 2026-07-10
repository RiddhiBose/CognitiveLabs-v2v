import type { ScholarshipRecommendation } from '../../types/ai.types';

interface ScholarshipResultCardProps {
  scholarship: ScholarshipRecommendation;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

function getStatusBadge(deadline?: string): { label: string; tone: string } {
  if (!deadline) {
    return { label: 'Open', tone: 'bg-emerald-100 text-emerald-700' };
  }

  const normalized = deadline.toLowerCase();
  if (normalized.includes('closed')) {
    return { label: 'Closed', tone: 'bg-rose-100 text-rose-700' };
  }
  if (normalized.includes('soon') || normalized.includes('within')) {
    return { label: 'Closing Soon', tone: 'bg-amber-100 text-amber-700' };
  }
  return { label: 'Open', tone: 'bg-emerald-100 text-emerald-700' };
}

export default function ScholarshipResultCard({ scholarship, onSave, saving, saved }: ScholarshipResultCardProps) {
  const badge = getStatusBadge(scholarship.deadline);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">{scholarship.provider ?? 'Official provider'}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{scholarship.title}</h3>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.tone}`}>{badge.label}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Match {scholarship.matchScore}%</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{scholarship.amount ?? 'Benefits not listed'}</span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{scholarship.summary}</p>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p><span className="font-semibold text-slate-800">Eligibility:</span> {scholarship.eligibility ?? 'Check official source for complete criteria.'}</p>
        <p><span className="font-semibold text-slate-800">Deadline:</span> {scholarship.deadline ?? 'Not available in current sources'}</p>
        <p><span className="font-semibold text-slate-800">Documents:</span> {typeof scholarship.metadata?.requiredDocuments === 'string' ? scholarship.metadata.requiredDocuments : 'Refer to official portal'}</p>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Why it matches</p>
        <p className="mt-1">{scholarship.reason}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {scholarship.applicationLink ? (
          <a
            href={scholarship.applicationLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Apply Now
          </a>
        ) : null}
        {scholarship.officialWebsite ? (
          <a
            href={scholarship.officialWebsite}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-violet-400 hover:text-violet-600"
          >
            Visit Official Website
          </a>
        ) : null}
        <button
          type="button"
          onClick={onSave}
          disabled={saving || saved}
          className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-violet-400 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save Scholarship'}
        </button>
      </div>
    </article>
  );
}
