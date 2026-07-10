import { useEffect, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useSaved } from '../../contexts/SavedContext';
import { SearchService } from '../../services/search';
import StartupFundingService from '../../services/StartupFundingService';
import {
  StartupFundingForm,
  StartupFundingResultCard,
  StartupFundingDetailsModal,
} from '../../components/startupFunding';
import LoadingCard from '../../components/common/LoadingCard';
import ErrorMessage from '../../components/common/ErrorMessage';
import type { StartupFundingRecommendation } from '../../types/ai.types';
import {
  STARTUP_FUNDING_FORM_DEFAULTS,
  type StartupFundingFormValues,
} from '../../types/startupFunding';

// ── Loading messages ─────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  'Searching verified funding opportunities…',
  'Checking official government portals…',
  'Searching trusted startup ecosystems…',
  'Analysing startup profile…',
  'Ranking funding opportunities…',
  'Preparing recommendations…',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function opportunityKey(o: StartupFundingRecommendation): string {
  return `${o.title}-${o.organization ?? o.source ?? 'unknown'}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StartupFundingPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { adjustCount } = useSaved();
  const location = useLocation();
  const prefill = (location.state as { prefill?: Partial<StartupFundingFormValues> } | null)?.prefill;

  const [formValues, setFormValues] = useState<StartupFundingFormValues>(
    prefill ? { ...STARTUP_FUNDING_FORM_DEFAULTS, ...prefill } : STARTUP_FUNDING_FORM_DEFAULTS,
  );
  const [results, setResults] = useState<StartupFundingRecommendation[]>([]);
  const [totalFound, setTotalFound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Save state
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Details modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<StartupFundingRecommendation | null>(null);

  const readyState = SearchService.isReady();

  // ── Cycle loading messages ────────────────────────────────────────────────

  useEffect(() => {
    if (!loading) {
      setStatusMessage('');
      return undefined;
    }
    let idx = 0;
    setStatusMessage(LOADING_MESSAGES[0]);
    const interval = window.setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setStatusMessage(LOADING_MESSAGES[idx]);
    }, 1400);
    return () => window.clearInterval(interval);
  }, [loading]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleChange = (
    field: keyof StartupFundingFormValues,
    value: string | string[],
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!profile) {
      setError('Please complete your profile before searching for funding.');
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);
    setResults([]);
    setHasSearched(true);

    const response = await StartupFundingService.searchFunding({
      profile,
      formValues,
    });

    setLoading(false);

    if (response.error) {
      setError(response.error);
      return;
    }

    setResults(response.results);
    setTotalFound(response.totalFound || response.results.length);
    if (response.warning) setWarning(response.warning);
  };

  const handleSave = async (opportunity: StartupFundingRecommendation) => {
    if (!user?.id) {
      setError('Please sign in to save opportunities.');
      return;
    }
    const key = opportunityKey(opportunity);
    if (savedKeys.has(key)) return;

    setSavingKey(key);
    const result = await StartupFundingService.saveOpportunity(user.id, opportunity);
    setSavingKey(null);

    if (result.success) {
      setSavedKeys((prev) => new Set([...prev, key]));
      adjustCount(1);
    } else {
      setError(result.error ?? 'Could not save this opportunity right now.');
    }
  };

  const handleViewDetails = (opportunity: StartupFundingRecommendation) => {
    setSelectedOpportunity(opportunity);
    setModalOpen(true);
  };

  // ── Split results ─────────────────────────────────────────────────────────

  const topRecommended = results.slice(0, 5);
  const allMatching = results.slice(5);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <header className="rounded-3xl bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center pr-10 text-9xl">🚀</div>
          <div className="relative z-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-100">
              AI startup funding finder
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Discover funding for your startup
            </h1>
            <p className="mt-3 text-sm leading-7 text-primary-50 sm:text-base">
              Get AI-powered recommendations for grants, incubators, accelerators, angel investors,
              government schemes and more — sourced live from official portals and trusted startup
              ecosystems. Your profile is used automatically.
            </p>
          </div>
        </header>

        {/* ── Form ───────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <StartupFundingForm
            values={formValues}
            onChange={handleChange}
            onSubmit={handleSubmit}
            loading={loading}
            isReady={readyState.ready}
            missingKeys={readyState.missing}
          />
          {profileLoading && <LoadingCard />}
          <ErrorMessage message={error} />
          {warning && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
              {warning}
            </div>
          )}
        </div>

        {/* ── Results section ──────────────────────────────────────────────── */}
        <section aria-label="Funding results" className="space-y-4">

          {/* Loading state */}
          {loading && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary-600 [animation-delay:-0.3s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary-400" />
                <p className="text-sm font-medium text-gray-700">
                  {statusMessage || 'Searching funding opportunities…'}
                </p>
              </div>
              <div className="space-y-3">
                <LoadingCard />
                <LoadingCard />
                <LoadingCard />
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && hasSearched && results.length === 0 && !error && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-lg">
              <p className="text-4xl mb-3" aria-hidden="true">🔍</p>
              <p className="font-semibold text-gray-800">No funding opportunities found</p>
              <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                No verified opportunities matched your startup profile from the live sources.
                Try adjusting your industry, stage, or funding type and search again.
              </p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              {/* Result count bar */}
              <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600 shadow-lg">
                Showing{' '}
                <span className="font-semibold text-gray-900">{totalFound || results.length}</span>{' '}
                verified funding opportunities matching your startup.
              </div>

              {/* Top 5 — highest match */}
              {topRecommended.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-gray-900">⭐ Top Recommended</h2>
                    <span className="text-sm text-gray-500">Highest match opportunities</span>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    {topRecommended.map((opp) => {
                      const key = opportunityKey(opp);
                      return (
                        <StartupFundingResultCard
                          key={key}
                          opportunity={opp}
                          onSave={() => handleSave(opp)}
                          saving={savingKey === key}
                          saved={savedKeys.has(key)}
                          onViewDetails={handleViewDetails}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All remaining matches */}
              {allMatching.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-gray-900">
                      All Matching Opportunities
                    </h2>
                    <span className="text-sm text-gray-500">
                      Every verified match sorted by relevance
                    </span>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    {allMatching.map((opp) => {
                      const key = opportunityKey(opp);
                      return (
                        <StartupFundingResultCard
                          key={key}
                          opportunity={opp}
                          onSave={() => handleSave(opp)}
                          saving={savingKey === key}
                          saved={savedKeys.has(key)}
                          onViewDetails={handleViewDetails}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Attribution footer */}
              <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-lg text-xs text-gray-500 leading-5">
                <p className="font-semibold text-gray-700 mb-1">Data sources &amp; disclaimer</p>
                Results are retrieved live from official government portals (startupindia.gov.in,
                dpiit.gov.in, msme.gov.in, sidbi.in, myscheme.gov.in) and trusted public sources
                (Inc42, YourStory, Crunchbase, LinkedIn, etc.). No funding data is hardcoded or
                simulated. Always verify details on the official website before applying. Deadlines
                and amounts may change — cite the source URL for the latest information.
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Details modal ─────────────────────────────────────────────────── */}
      <StartupFundingDetailsModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedOpportunity(null);
        }}
        opportunity={selectedOpportunity}
      />
    </div>
  );
}
