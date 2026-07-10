// LoanResults — result grid with empty and error states
// Receives the full recommendation array + save callbacks from parent.

import type { EducationLoanRecommendation } from '../../types/educationLoan';
import LoanCard from './LoanCard';

// ── Empty state ───────────────────────────────────────────────────────────────

function NoResults({ warning }: { warning?: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      <span className="mb-3 text-4xl" aria-hidden="true">🔍</span>
      <h3 className="mb-1 text-base font-semibold text-gray-700">No matching loans found</h3>
      <p className="max-w-sm text-sm text-gray-500">
        {warning ??
          'We could not find education loans that match your current criteria. Try adjusting the course, loan amount, or collateral preference.'}
      </p>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center">
      <span className="mb-3 text-4xl" aria-hidden="true">⚠️</span>
      <h3 className="mb-1 text-base font-semibold text-red-700">Something went wrong</h3>
      <p className="mb-4 max-w-md text-sm text-red-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// ── Results header ────────────────────────────────────────────────────────────

function ResultsHeader({
  count,
  cached,
  durationMs,
}: {
  count: number;
  cached: boolean;
  durationMs: number;
}) {
  const seconds = (durationMs / 1000).toFixed(1);
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-gray-800">
          {count} Loan{count !== 1 ? 's' : ''} Found
        </h2>
        <p className="text-xs text-gray-400">
          {cached
            ? 'From cache · '
            : `Searched live sources in ${seconds}s · `}
          Sorted by match score
        </p>
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
        <span aria-hidden="true">✨</span>
        AI Powered
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface LoanResultsProps {
  loans: EducationLoanRecommendation[];
  error: string | null;
  warning?: string | null;
  cached: boolean;
  durationMs: number;
  savedIds: Set<string>;
  savingId: string | null;
  onSave: (loan: EducationLoanRecommendation) => void;
  onUnsave: (loan: EducationLoanRecommendation) => void;
  onRetry?: () => void;
  onViewDetails?: (loan: EducationLoanRecommendation) => void;
}

export default function LoanResults({
  loans,
  error,
  warning,
  cached,
  durationMs,
  savedIds,
  savingId,
  onSave,
  onUnsave,
  onRetry,
  onViewDetails,
}: LoanResultsProps) {
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (loans.length === 0) {
    return <NoResults warning={warning} />;
  }

  return (
    <section aria-label="Education loan recommendations">
      <ResultsHeader count={loans.length} cached={cached} durationMs={durationMs} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {loans.map((loan, index) => {
          const itemId = `${loan.loanSchemeName ?? loan.title}-${loan.bankName ?? loan.bank ?? ''}`
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 80);

          return (
            <LoanCard
              key={`${itemId}-${index}`}
              loan={loan}
              isSaved={savedIds.has(itemId)}
              onSave={onSave}
              onUnsave={onUnsave}
              saveLoading={savingId === itemId}
              onViewDetails={onViewDetails}
            />
          );
        })}
      </div>

      {/* Disclaimer */}
      <p className="mt-6 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
        <strong>Disclaimer:</strong> Loan details are sourced from official bank and government
        portals via AI-assisted search. Interest rates and eligibility criteria may change.
        Always verify directly with the bank or lender before applying.
      </p>
    </section>
  );
}
