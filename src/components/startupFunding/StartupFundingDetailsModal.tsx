import type { StartupFundingRecommendation } from '../../types/ai.types';

interface StartupFundingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: StartupFundingRecommendation | null;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}

export default function StartupFundingDetailsModal({
  isOpen,
  onClose,
  opportunity,
}: StartupFundingDetailsModalProps) {
  if (!isOpen || !opportunity) return null;

  const amountDisplay = opportunity.maxAmount
    ? opportunity.minAmount
      ? `${opportunity.minAmount} – ${opportunity.maxAmount}`
      : opportunity.maxAmount
    : opportunity.minAmount ?? null;

  const applyUrl = opportunity.applicationPortal ?? opportunity.applicationLink ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sf-modal-title"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        {/* ── Modal header ─────────────────────────────────────────────── */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {opportunity.organization && (
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-600">
                {opportunity.organization}
              </p>
            )}
            <h2 id="sf-modal-title" className="mt-1 text-xl font-bold text-slate-900 leading-snug">
              {opportunity.title}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {opportunity.fundingType && (
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                  {opportunity.fundingType}
                </span>
              )}
              {opportunity.sourceType && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    opportunity.sourceType === 'Official'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {opportunity.sourceType === 'Official' ? '🏛️ Official' : '🔗 Trusted Source'}
                </span>
              )}
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Match {opportunity.matchScore}%
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {/* ── Summary ─────────────────────────────────────────────────── */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Summary</p>
            <p className="text-sm leading-7 text-slate-700">{opportunity.summary}</p>
          </div>

          {/* ── Why it matches ───────────────────────────────────────────── */}
          <div className="rounded-xl bg-orange-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600 mb-1.5">Why it matches your startup</p>
            <p className="text-sm leading-6 text-slate-700">{opportunity.reason}</p>
          </div>

          {/* ── Key info grid ────────────────────────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Row label="Organisation" value={opportunity.organization} />
            <Row label="Funding type" value={opportunity.fundingType} />
            <Row label="Funding amount" value={amountDisplay} />
            <Row label="Equity requirement" value={opportunity.equityRequirement} />
            <Row label="Startup stage" value={opportunity.stage} />
            <Row label="Industry / Sector" value={opportunity.sector} />
            <Row label="Application deadline" value={opportunity.deadline} />
            <Row label="Location" value={opportunity.location} />
            <Row label="Women founder preference" value={opportunity.womenFounderPreference} />
            <Row label="Registration required" value={opportunity.registrationRequired} />
            <Row label="Revenue stage" value={opportunity.revenueStageRequired} />
            <Row label="Contact" value={opportunity.contactInfo} />
          </div>

          {/* ── Eligibility ─────────────────────────────────────────────── */}
          {opportunity.eligibility && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Eligibility criteria</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{opportunity.eligibility}</p>
              </div>
            </div>
          )}

          {/* ── Benefits ────────────────────────────────────────────────── */}
          {opportunity.benefits && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Benefits offered</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{opportunity.benefits}</p>
              </div>
            </div>
          )}

          {/* ── Application process ──────────────────────────────────────── */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span aria-hidden="true" className="text-xl">📋</span>
              <p className="text-sm font-bold text-slate-900">How to apply</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                {opportunity.applicationProcess ?? 'Please visit the official website for the application process.'}
              </p>
            </div>
          </div>

          {/* ── Required documents ──────────────────────────────────────── */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span aria-hidden="true" className="text-xl">📄</span>
              <p className="text-sm font-bold text-slate-900">Required documents</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
                {opportunity.requiredDocuments ?? 'Please visit the official website for document requirements.'}
              </p>
            </div>
          </div>

          {/* ── Source attribution ──────────────────────────────────────── */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm">
            <p className="font-semibold text-indigo-800 mb-1">Source information</p>
            <p className="text-indigo-700">
              <span className="font-medium">Source type: </span>
              {opportunity.sourceType ?? 'Not specified'}
            </p>
            {opportunity.source && (
              <p className="mt-1 text-indigo-700">
                <span className="font-medium">Source URL: </span>
                <a
                  href={opportunity.source}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-indigo-900 break-all"
                >
                  {opportunity.source}
                </a>
              </p>
            )}
          </div>

          {/* ── CTA buttons ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 pt-1">
            {applyUrl && (
              <a
                href={applyUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
              >
                Apply Now
              </a>
            )}
            {opportunity.officialWebsite && (
              <a
                href={opportunity.officialWebsite}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-400 hover:text-orange-600"
              >
                Visit Official Website
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
