import type { StartupFundingRecommendation } from '../../types/ai.types';

interface StartupFundingResultCardProps {
  opportunity: StartupFundingRecommendation;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  onViewDetails: (opportunity: StartupFundingRecommendation) => void;
}

function DeadlineBadge({ deadline }: { deadline?: string }) {
  if (!deadline) {
    return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Open</span>;
  }
  const lower = deadline.toLowerCase();
  if (lower.includes('closed')) {
    return <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Closed</span>;
  }
  if (lower.includes('soon') || lower.includes('within') || lower.includes('last')) {
    return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Closing Soon</span>;
  }
  return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Open</span>;
}

function SourceBadge({ sourceType }: { sourceType?: string }) {
  const isOfficial = sourceType === 'Official';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isOfficial
          ? 'bg-indigo-100 text-indigo-700'
          : 'bg-slate-100 text-slate-600'
      }`}
      title={isOfficial ? 'Information from an official government or organisation website' : 'Information from a trusted public source'}
    >
      {isOfficial ? '🏛️ Official' : '🔗 Trusted Source'}
    </span>
  );
}

function MatchScoreBadge({ score }: { score: number }) {
  const colour =
    score >= 80 ? 'bg-emerald-100 text-emerald-700' :
    score >= 60 ? 'bg-orange-100 text-orange-700' :
    'bg-slate-100 text-slate-600';
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colour}`}>
      Match {score}%
    </span>
  );
}

export default function StartupFundingResultCard({
  opportunity,
  onSave,
  saving,
  saved,
  onViewDetails,
}: StartupFundingResultCardProps) {
  const amountDisplay = opportunity.maxAmount
    ? opportunity.minAmount
      ? `${opportunity.minAmount} – ${opportunity.maxAmount}`
      : opportunity.maxAmount
    : opportunity.minAmount ?? null;

  const applyUrl = opportunity.applicationPortal ?? opportunity.applicationLink ?? null;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold uppercase tracking-[0.16em] text-orange-600">
            {opportunity.organization ?? opportunity.source ?? 'Organisation'}
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-snug text-slate-900">{opportunity.title}</h3>
        </div>
        <DeadlineBadge deadline={opportunity.deadline} />
      </div>

      {/* ── Badges ─────────────────────────────────────────────────────── */}
      <div className="mt-3 flex flex-wrap gap-2">
        <MatchScoreBadge score={opportunity.matchScore} />
        {opportunity.fundingType && (
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 ring-1 ring-orange-200">
            {opportunity.fundingType}
          </span>
        )}
        {opportunity.stage && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {opportunity.stage}
          </span>
        )}
        {amountDisplay && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {amountDisplay}
          </span>
        )}
        {opportunity.sector && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {opportunity.sector}
          </span>
        )}
        <SourceBadge sourceType={opportunity.sourceType} />
      </div>

      {/* ── Summary ────────────────────────────────────────────────────── */}
      <p className="mt-4 text-sm leading-6 text-slate-600 line-clamp-3">{opportunity.summary}</p>

      {/* ── Key details ────────────────────────────────────────────────── */}
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        {opportunity.eligibility && (
          <p>
            <span className="font-semibold text-slate-800">Eligibility: </span>
            {opportunity.eligibility}
          </p>
        )}
        {opportunity.womenFounderPreference && (
          <p>
            <span className="font-semibold text-slate-800">Women founders: </span>
            {opportunity.womenFounderPreference}
          </p>
        )}
        {opportunity.equityRequirement && (
          <p>
            <span className="font-semibold text-slate-800">Equity: </span>
            {opportunity.equityRequirement}
          </p>
        )}
        {opportunity.deadline && (
          <p>
            <span className="font-semibold text-slate-800">Deadline: </span>
            {opportunity.deadline}
          </p>
        )}
        {opportunity.location && (
          <p>
            <span className="font-semibold text-slate-800">Location: </span>
            {opportunity.location}
          </p>
        )}
      </div>

      {/* ── Why it matches ─────────────────────────────────────────────── */}
      <div className="mt-4 rounded-xl bg-orange-50 p-3 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Why it matches</p>
        <p className="mt-1 leading-5">{opportunity.reason}</p>
      </div>

      {/* ── Benefits (if available) ────────────────────────────────────── */}
      {opportunity.benefits && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Benefits</p>
          <p className="mt-1 leading-5">{opportunity.benefits}</p>
        </div>
      )}

      {/* ── Action buttons ─────────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(opportunity)}
          className="rounded-full bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          📋 View Details
        </button>

        {applyUrl && (
          <a
            href={applyUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Apply Now
          </a>
        )}

        {opportunity.officialWebsite && opportunity.officialWebsite !== applyUrl && (
          <a
            href={opportunity.officialWebsite}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-400 hover:text-orange-600"
          >
            Official Website
          </a>
        )}

        {opportunity.source && (
          <a
            href={opportunity.source}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            View Source
          </a>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={saving || saved}
          className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Opportunity'}
        </button>
      </div>
    </article>
  );
}
