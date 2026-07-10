import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
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

  const [formValues, setFormValues] = useState<StartupFundingFormValues>(
    STARTUP_FUNDING_FORM_DEFAULTS,
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
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <header className="rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-100">
            AI startup funding finder
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Discover funding for your startup
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-orange-50 sm:text-base">
            Get AI-powered recommendations for grants, incubators, accelerators, angel investors,
            government schemes and more — sourced live from official portals and trusted startup
            ecosystems. Your profile is used automatically.
          </p>
        </header>

        {/* ── Main grid ───────────────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

          {/* Left — form */}
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
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                {warning}
              </div>
            )}
          </div>

          {/* Right — profile summary */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm self-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">
                Your profile summary
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">Founder context</h2>
              <p className="mt-1 text-xs text-slate-500">
                Retrieved automatically — you don't need to re-enter these.
              </p>
            </div>

            <div className="space-y-2.5 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Name: </span>
                {profile?.full_name ?? 'Not available'}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Age: </span>
                {profile?.age ?? 'Not available'}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Qualification: </span>
                {profile?.qualification ?? 'Not available'}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Occupation: </span>
                {profile?.occupation ?? 'Not available'}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Experience: </span>
                {profile?.experience != null ? `${profile.experience} years` : 'Not available'}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Industry: </span>
                {profile?.industry ?? 'Not available'}
              </p>
              <p>
                <span className="font-semibold text-slate-800">State: </span>
                {profile?.state ?? 'Not available'}
              </p>
              <p>
                <span className="font-semibold text-slate-800">City: </span>
                {profile?.city ?? 'Not available'}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Role: </span>
                {profile?.role ?? 'Not available'}
              </p>
            </div>

            {/* Source disclaimer */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-700 leading-5">
              <p className="font-semibold mb-0.5">About these results</p>
              All recommendations are sourced live from official government portals,
              incubators, and trusted startup ecosystems. No hardcoded data is used.
              Every result cites its original source URL.
            </div>
          </div>
        </div>

        {/* ── Results section ──────────────────────────────────────────────── */}
        <section aria-label="Funding results" className="space-y-4">

          {/* Loading state */}
          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 w-2 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.3s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-orange-400 [animation-delay:-0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-amber-400" />
                <p className="text-sm font-medium text-slate-700">
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

          {/* Empty state — only show after a completed search */}
          {!loading && hasSearched && results.length === 0 && !error && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <p className="text-4xl mb-3" aria-hidden="true">🔍</p>
              <p className="font-semibold text-slate-800">No funding opportunities found</p>
              <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                No verified opportunities matched your startup profile from the live sources.
                Try adjusting your industry, stage, or funding type and search again.
              </p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              {/* Result count bar */}
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-sm text-slate-600">
                  Showing{' '}
                  <span className="font-semibold text-slate-900">{totalFound || results.length}</span>{' '}
                  verified funding opportunities matching your startup.
                </p>
              </div>

              {/* Top 5 — highest match */}
              {topRecommended.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">⭐ Top Recommended</h2>
                    <span className="text-sm text-slate-500">Highest match opportunities</span>
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
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">
                      All Matching Opportunities
                    </h2>
                    <span className="text-sm text-slate-500">
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
              <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm text-xs text-slate-500 leading-5">
                <p className="font-semibold text-slate-700 mb-1">Data sources &amp; disclaimer</p>
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
