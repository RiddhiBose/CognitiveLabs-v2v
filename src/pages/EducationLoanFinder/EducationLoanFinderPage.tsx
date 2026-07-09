// EducationLoanFinderPage — main orchestrator for the AI-powered Education Loan Finder
//
// Responsibilities:
//   - Read user profile from ProfileContext (no re-asking for profile data)
//   - Manage form state + validation
//   - Call LoanService.findLoans() → SearchService → Tavily + Gemini pipeline
//   - Persist search history and saved items via LoanService
//   - Coordinate loading, result, and error UI states
//   - Never calls Tavily, Gemini, PromptBuilder, or SearchService directly

import { useState, useCallback, useEffect, useRef } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import LoanService from '../../services/LoanService';
import SearchService from '../../services/search/searchService';
import {
  LoanForm,
  LoanLoadingState,
  LoanResults,
} from '../../components/educationLoan';
import type {
  LoanFormData,
  LoanFormErrors,
  EducationLoanRecommendation,
} from '../../types/educationLoan';
import { EMPTY_LOAN_FORM } from '../../types/educationLoan';
import type { UserProfileForSearch } from '../../types/ai.types';

// ── Profile availability banner ───────────────────────────────────────────────

function ProfileMissingBanner() {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
      <span className="mt-0.5 flex-shrink-0 text-base" aria-hidden="true">⚠️</span>
      <p>
        Your profile is incomplete. Completing it helps us personalise loan recommendations
        based on your category, income, and state.{' '}
        <a href="/complete-profile" className="font-semibold underline">
          Complete profile →
        </a>
      </p>
    </div>
  );
}

// ── Profile summary chip ──────────────────────────────────────────────────────

function ProfileChip({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700">
      <span className="font-medium">{label}:</span> {value}
    </span>
  );
}

// ── Profile preview bar ───────────────────────────────────────────────────────

interface ProfilePreviewProps {
  profile: UserProfileForSearch;
}

function ProfilePreview({ profile }: ProfilePreviewProps) {
  const incomeLabels: Record<string, string> = {
    below_2l: 'Below ₹2L',
    '2l_5l': '₹2–5L',
    '5l_8l': '₹5–8L',
    '8l_12l': '₹8–12L',
    '12l_20l': '₹12–20L',
    above_20l: 'Above ₹20L',
  };
  const categoryLabels: Record<string, string> = {
    general: 'General',
    obc: 'OBC',
    sc: 'SC',
    st: 'ST',
    ews: 'EWS',
  };

  return (
    <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Auto-filled from your profile
      </p>
      <div className="flex flex-wrap gap-2">
        <ProfileChip label="Name" value={profile.full_name} />
        <ProfileChip label="State" value={profile.state} />
        <ProfileChip
          label="Category"
          value={profile.category ? categoryLabels[profile.category] ?? profile.category : null}
        />
        <ProfileChip
          label="Family Income"
          value={
            profile.annual_income
              ? incomeLabels[profile.annual_income] ?? profile.annual_income
              : null
          }
        />
        <ProfileChip label="Qualification" value={profile.qualification?.toUpperCase()} />
        {profile.pwd_status === 'yes' && (
          <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs text-purple-700">
            PWD: Yes
          </span>
        )}
      </div>
    </div>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden="true">💰</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Education Loan Finder</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            AI-powered recommendations from official bank and government portals
          </p>
        </div>
      </div>
    </div>
  );
}

// ── API configuration warning ─────────────────────────────────────────────────

function ApiWarning({ missing }: { missing: string[] }) {
  return (
    <div className="mb-5 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
      <strong>Configuration required:</strong> The following API keys are missing:{' '}
      <code className="mx-1 rounded bg-orange-100 px-1 font-mono text-xs">
        {missing.join(', ')}
      </code>
      . Add them to your <code className="rounded bg-orange-100 px-1 font-mono text-xs">.env</code>{' '}
      file to enable AI-powered search.
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type PageState = 'form' | 'loading' | 'results';

export default function EducationLoanFinderPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { user } = useAuth();

  // Form state
  const [form, setForm] = useState<LoanFormData>(EMPTY_LOAN_FORM);
  const [errors, setErrors] = useState<LoanFormErrors>({});

  // Page state machine
  const [pageState, setPageState] = useState<PageState>('form');

  // Results state
  const [loans, setLoans] = useState<EducationLoanRecommendation[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchWarning, setSearchWarning] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [durationMs, setDurationMs] = useState(0);

  // Save state
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  // API readiness
  const [missingKeys, setMissingKeys] = useState<string[]>([]);

  // Ref to scroll results into view
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Check API keys on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const { missing } = SearchService.isReady();
    setMissingKeys(missing);
  }, []);

  // ── Load saved loan IDs for this user ───────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    LoanService.getSavedLoanIds(user.id).then(setSavedIds);
  }, [user?.id]);

  // ── Form handlers ───────────────────────────────────────────────────────────

  const handleChange = useCallback(
    (field: keyof LoanFormData, value: string | boolean | number) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear individual field error on change
      setErrors((prev) => {
        if (!(field in prev)) return prev;
        const next = { ...prev };
        delete next[field as keyof LoanFormErrors];
        return next;
      });
    },
    [],
  );

  const handleReset = useCallback(() => {
    setForm(EMPTY_LOAN_FORM);
    setErrors({});
    setPageState('form');
    setLoans([]);
    setSearchError(null);
    setSearchWarning(null);
  }, []);

  // ── Build UserProfileForSearch from Profile context ─────────────────────────

  const buildSearchProfile = useCallback((): UserProfileForSearch => {
    return {
      full_name: profile?.full_name ?? user?.email ?? 'User',
      role: profile?.role ?? 'learner',
      qualification: profile?.qualification ?? null,
      qualification_other: profile?.qualification_other ?? null,
      specialization: profile?.specialization ?? null,
      occupation: profile?.occupation ?? null,
      experience: profile?.experience ?? null,
      annual_income: profile?.annual_income ?? null,
      category:
        profile?.category && profile.category !== 'prefer_not_to_say'
          ? profile.category
          : null,
      pwd_status: profile?.pwd_status ?? null,
      state: profile?.state ?? null,
      city: profile?.city ?? null,
      bio: profile?.bio ?? null,
      job_title: profile?.job_title ?? null,
      industry: profile?.industry ?? null,
    };
  }, [profile, user?.email]);

  // ── Submit handler ──────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    // Validate
    const validationErrors = LoanService.validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setPageState('loading');
    setSearchError(null);
    setSearchWarning(null);

    const searchProfile = buildSearchProfile();

    try {
      const response = await LoanService.findLoans(form, searchProfile);

      setLoans(response.results);
      setSearchError(response.error);
      setSearchWarning(response.warning ?? null);
      setCached(response.cached);
      setDurationMs(response.searchDurationMs);
      setPageState('results');

      // Persist search history (non-blocking)
      if (user?.id) {
        LoanService.saveSearchHistory(user.id, form, response.results.length).catch(
          () => {/* swallow — history is non-critical */},
        );
      }

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setSearchError(message);
      setLoans([]);
      setPageState('results');
    }
  }, [form, buildSearchProfile, user?.id]);

  // ── Retry from error state ──────────────────────────────────────────────────

  const handleRetry = useCallback(() => {
    setPageState('form');
    setSearchError(null);
  }, []);

  // ── Save / unsave handlers ──────────────────────────────────────────────────

  const handleSave = useCallback(
    async (loan: EducationLoanRecommendation) => {
      if (!user?.id) return;
      const itemId = LoanService.buildItemId(loan);
      setSavingId(itemId);
      const result = await LoanService.saveLoan(user.id, loan);
      if (!result.error) {
        setSavedIds((prev) => new Set([...prev, itemId]));
      }
      setSavingId(null);
    },
    [user?.id],
  );

  const handleUnsave = useCallback(
    async (loan: EducationLoanRecommendation) => {
      if (!user?.id) return;
      const itemId = LoanService.buildItemId(loan);
      setSavingId(itemId);
      const result = await LoanService.unsaveLoan(user.id, loan);
      if (!result.error) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
      setSavingId(null);
    },
    [user?.id],
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span
          className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"
          role="status"
          aria-label="Loading profile…"
        />
      </div>
    );
  }

  const searchProfile = buildSearchProfile();
  const isProfileIncomplete = !profile?.is_profile_complete;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader />

      {/* API key warning */}
      {missingKeys.length > 0 && <ApiWarning missing={missingKeys} />}

      {/* Profile incomplete warning */}
      {isProfileIncomplete && <ProfileMissingBanner />}

      {/* Profile preview (auto-filled data) */}
      {profile && <ProfilePreview profile={searchProfile} />}

      {/* ── Form section ─────────────────────────────────────────────────────── */}
      {(pageState === 'form' || pageState === 'loading') && (
        <div className="mb-8">
          <LoanForm
            form={form}
            errors={errors}
            loading={pageState === 'loading'}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onReset={handleReset}
          />
        </div>
      )}

      {/* ── Loading state ─────────────────────────────────────────────────────── */}
      {pageState === 'loading' && (
        <div className="mt-2">
          <LoanLoadingState />
        </div>
      )}

      {/* ── Results section ───────────────────────────────────────────────────── */}
      {pageState === 'results' && (
        <div ref={resultsRef}>
          {/* Search again link */}
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => setPageState('form')}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:underline focus:outline-none"
            >
              <span aria-hidden="true">←</span>
              Modify search
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:underline focus:outline-none"
            >
              <span aria-hidden="true">🔄</span>
              Re-run search
            </button>
          </div>

          <LoanResults
            loans={loans}
            error={searchError}
            warning={searchWarning}
            cached={cached}
            durationMs={durationMs}
            savedIds={savedIds}
            savingId={savingId}
            onSave={handleSave}
            onUnsave={handleUnsave}
            onRetry={handleRetry}
          />
        </div>
      )}
    </div>
  );
}
