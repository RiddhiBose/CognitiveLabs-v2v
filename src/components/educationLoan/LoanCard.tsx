// LoanCard — result card for a single education loan recommendation
// Pure presentational component.

import type { EducationLoanRecommendation } from '../../types/educationLoan';

// ── Match score badge ─────────────────────────────────────────────────────────

function MatchBadge({ score }: { score: number }) {
  const color =
    score >= 75
      ? 'bg-green-100 text-green-700 border-green-200'
      : score >= 50
      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
      : 'bg-gray-100 text-gray-600 border-gray-200';

  const label = score >= 75 ? 'Great Match' : score >= 50 ? 'Good Match' : 'Possible Match';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}
      aria-label={`Match score: ${score} out of 100 — ${label}`}
    >
      <span aria-hidden="true">●</span>
      {score}% · {label}
    </span>
  );
}

// ── Detail pill ───────────────────────────────────────────────────────────────

function DetailPill({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-1.5">
      <span className="mt-0.5 text-sm" aria-hidden="true">
        {icon}
      </span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface LoanCardProps {
  loan: EducationLoanRecommendation;
  isSaved: boolean;
  onSave: (loan: EducationLoanRecommendation) => void;
  onUnsave: (loan: EducationLoanRecommendation) => void;
  saveLoading?: boolean;
  onViewDetails?: (loan: EducationLoanRecommendation) => void;
}

export default function LoanCard({
  loan,
  isSaved,
  onSave,
  onUnsave,
  saveLoading = false,
  onViewDetails,
}: LoanCardProps) {
  const bankName = loan.bankName ?? loan.bank ?? '';
  const schemeName = loan.loanSchemeName ?? loan.title;
  const websiteUrl = loan.officialWebsite ?? loan.source ?? '#';
  const applyUrl = loan.applyNowLink ?? loan.applicationLink ?? loan.officialWebsite ?? '#';

  const handleSaveToggle = () => {
    if (isSaved) onUnsave(loan);
    else onSave(loan);
  };

  return (
    <article
      className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      aria-label={`Loan: ${schemeName}`}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-primary-600">
              {bankName || 'Bank'}
            </p>
            <h3 className="mt-0.5 text-base font-bold leading-snug text-gray-900">
              {schemeName}
            </h3>
          </div>
          {/* Save button */}
          <button
            onClick={handleSaveToggle}
            disabled={saveLoading}
            aria-label={isSaved ? `Unsave ${schemeName}` : `Save ${schemeName}`}
            className={`flex-shrink-0 rounded-full p-1.5 transition-colors disabled:opacity-50 ${
              isSaved
                ? 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-primary-500'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
          </button>
        </div>

        <MatchBadge score={loan.matchScore} />

        {/* Government subsidy tag */}
        {loan.governmentSubsidy && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            <span aria-hidden="true">🏛️</span> Govt Subsidy Available
          </span>
        )}
        {/* Female benefits tag */}
        {loan.femaleApplicantBenefits && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-pink-200 bg-pink-50 px-2.5 py-0.5 text-xs font-semibold text-pink-700">
            <span aria-hidden="true">♀</span> Women Concession
          </span>
        )}
      </div>

      {/* ── Key details grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-5">
        <DetailPill icon="📊" label="Interest Rate" value={loan.interestRate} />
        <DetailPill icon="💰" label="Max Loan Amount" value={loan.maxAmount} />
        <DetailPill icon="🗓️" label="Repayment Period" value={loan.repaymentPeriod} />
        <DetailPill icon="⏸️" label="Moratorium Period" value={loan.moratoriumPeriod} />
        <DetailPill icon="🏠" label="Collateral" value={loan.collateralRequirement} />
        <DetailPill icon="👥" label="Co-applicant" value={loan.coapplicantRequirement} />
        {loan.processingFee && (
          <DetailPill icon="🧾" label="Processing Fee" value={loan.processingFee} />
        )}
      </div>

      {/* ── Eligibility summary ──────────────────────────────────────────────── */}
      {loan.eligibilitySummary && (
        <div className="border-t border-gray-100 px-5 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Eligibility
          </p>
          <p className="text-sm text-gray-700">{loan.eligibilitySummary}</p>
        </div>
      )}

      {/* ── Why recommended ──────────────────────────────────────────────────── */}
      {loan.reason && (
        <div className="border-t border-gray-100 px-5 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Why Recommended
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">{loan.reason}</p>
        </div>
      )}

      {/* ── Required documents (collapsed list) ──────────────────────────────── */}
      {loan.requiredDocuments && loan.requiredDocuments.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Key Documents Required
          </p>
          <ul className="space-y-0.5">
            {loan.requiredDocuments.slice(0, 5).map((doc, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                <span className="mt-0.5 text-primary-400" aria-hidden="true">•</span>
                {doc}
              </li>
            ))}
            {loan.requiredDocuments.length > 5 && (
              <li className="text-xs text-gray-400">
                +{loan.requiredDocuments.length - 5} more documents
              </li>
            )}
          </ul>
        </div>
      )}

      {/* ── Source ───────────────────────────────────────────────────────────── */}
      {loan.source && (
        <div className="border-t border-gray-100 px-5 py-2">
          <p className="truncate text-xs text-gray-400">
            Source:{' '}
            <a
              href={loan.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:underline"
            >
              {loan.source.replace(/^https?:\/\//, '').split('/')[0]}
            </a>
          </p>
        </div>
      )}

      {/* ── CTA buttons ──────────────────────────────────────────────────────── */}
      <div className="mt-auto border-t border-gray-100 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(loan)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              aria-label={`View details for ${schemeName}`}
            >
              <span aria-hidden="true">📋</span>
              View Details
            </button>
          )}
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100"
            aria-label={`Visit official website for ${schemeName}`}
          >
            <span aria-hidden="true">🌐</span>
            Official Website
          </a>
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            aria-label={`Apply now for ${schemeName}`}
          >
            <span aria-hidden="true">✍️</span>
            Apply Now
          </a>
        </div>
        <button
          onClick={handleSaveToggle}
          disabled={saveLoading}
          className={`mt-2 w-full rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            isSaved
              ? 'border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100'
              : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {isSaved ? '🔖 Saved' : '🔖 Save Loan'}
        </button>
      </div>
    </article>
  );
}
