import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useSaved } from '../../contexts/SavedContext';
import ErrorMessage from '../../components/common/ErrorMessage';
import LoadingCard from '../../components/common/LoadingCard';
import DetailsModal from '../../components/common/DetailsModal';
import { ScholarshipFinderForm, ScholarshipResultCard } from '../../components/scholarship';
import ScholarshipService from '../../services/ScholarshipService';
import type { ScholarshipRecommendation } from '../../types/ai.types';
import { SCHOLARSHIP_FORM_DEFAULTS, type ScholarshipFormValues } from '../../types/scholarship';
import { SearchService } from '../../services/search';

const loadingMessages = [
  'Searching official scholarship portals…',
  'Gathering every verified opportunity…',
  'Checking eligibility against your profile…',
  'Ranking scholarships by relevance…',
  'Preparing the full results list…',
];

export default function ScholarshipFinderPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { adjustCount } = useSaved();
  const [formValues, setFormValues] = useState<ScholarshipFormValues>(SCHOLARSHIP_FORM_DEFAULTS);
  const [results, setResults] = useState<ScholarshipRecommendation[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState<ScholarshipRecommendation | null>(null);

  const readyState = SearchService.isReady();

  useEffect(() => {
    if (!loading) {
      setStatusMessage('');
      return undefined;
    }

    let index = 0;
    const interval = window.setInterval(() => {
      index = (index + 1) % loadingMessages.length;
      setStatusMessage(loadingMessages[index]);
    }, 1200);

    return () => window.clearInterval(interval);
  }, [loading]);

  const handleChange = (field: keyof ScholarshipFormValues, value: string | string[]) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) {
      setError('Please complete your profile before searching for scholarships.');
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);
    setStatusMessage(loadingMessages[0]);

    const response = await ScholarshipService.searchScholarships({
      profile,
      formValues,
    });

    setLoading(false);

    if (response.error) {
      setError(response.error);
      setResults([]);
      setResultCount(0);
      return;
    }

    setResults(response.results);
    setResultCount(response.totalFound || response.results.length);
    if (response.warning) {
      setWarning(response.warning);
    }
  };

  const handleSave = async (scholarship: ScholarshipRecommendation) => {
    if (!user?.id) {
      setError('Please sign in before saving scholarships.');
      return;
    }

    const key = `${scholarship.title}-${scholarship.provider ?? scholarship.source}`;
    if (savedIds.includes(key)) {
      return;
    }

    setSavingId(key);
    const result = await ScholarshipService.saveScholarship(user.id, scholarship);
    setSavingId(null);

    if (result.success) {
      setSavedIds((prev) => [...prev, key]);
      adjustCount(1);
    } else {
      setError(result.error ?? 'Could not save this scholarship right now.');
    }
  };

  const handleViewDetails = (scholarship: ScholarshipRecommendation) => {
    setSelectedScholarship(scholarship);
    setDetailsModalOpen(true);
  };

  const topRecommended = results.slice(0, 5);
  const allMatching = results.slice(5);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-8 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-100">AI scholarship finder</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Find scholarships from official sources</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-violet-50 sm:text-base">
            Your profile details are reused automatically for eligibility, while the search goal section defines the scholarship level, degree and location you want to discover.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <ScholarshipFinderForm
              values={formValues}
              onChange={handleChange}
              onSubmit={handleSubmit}
              loading={loading}
              isReady={readyState.ready}
              missingKeys={readyState.missing}
            />

            {profileLoading ? <LoadingCard /> : null}
            <ErrorMessage message={error} />
            {warning ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">{warning}</div> : null}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Your profile summary</p>
              <h2 className="text-xl font-semibold text-slate-900">Eligibility context</h2>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-800">Name:</span> {profile?.full_name ?? 'Not available'}</p>
              <p><span className="font-semibold text-slate-800">Qualification:</span> {profile?.qualification ?? 'Not available'}</p>
              <p><span className="font-semibold text-slate-800">Current degree:</span> {profile?.specialization ?? 'Not available'}</p>
              <p><span className="font-semibold text-slate-800">Current year:</span> {profile?.age ? `${profile.age}` : 'Not available'}</p>
              <p><span className="font-semibold text-slate-800">State:</span> {profile?.state ?? 'Not available'}</p>
              <p><span className="font-semibold text-slate-800">City:</span> {profile?.city ?? 'Not available'}</p>
              <p><span className="font-semibold text-slate-800">Gender:</span> {profile?.gender ?? 'Not available'}</p>
              <p><span className="font-semibold text-slate-800">Category:</span> {profile?.category ?? 'Not available'}</p>
              <p><span className="font-semibold text-slate-800">Annual family income:</span> {profile?.annual_income ?? 'Not available'}</p>
              <p><span className="font-semibold text-slate-800">PWD:</span> {profile?.pwd_status ?? 'Not available'}</p>
              <p><span className="font-semibold text-slate-800">Occupation:</span> {profile?.occupation ?? 'Not available'}</p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 text-sm font-medium text-slate-700">{statusMessage || 'Preparing scholarship results…'}</div>
              <div className="space-y-3">
                <LoadingCard />
                <LoadingCard />
              </div>
            </div>
          ) : null}

          {!loading && results.length === 0 && !error ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
              No scholarships matching your profile were found from official sources yet. Try adjusting your filters and searching again.
            </div>
          ) : null}

          {results.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                Showing {resultCount || results.length} verified scholarships matching your search.
              </div>

              {topRecommended.length > 0 ? (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">⭐ Top Recommended</h3>
                    <span className="text-sm text-slate-500">Highest match opportunities</span>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    {topRecommended.map((scholarship) => (
                      <ScholarshipResultCard
                        key={`${scholarship.title}-${scholarship.source}`}
                        scholarship={scholarship}
                        onSave={() => handleSave(scholarship)}
                        saving={savingId === `${scholarship.title}-${scholarship.provider ?? scholarship.source}`}
                        saved={savedIds.includes(`${scholarship.title}-${scholarship.provider ?? scholarship.source}`)}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {allMatching.length > 0 ? (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">All Matching Scholarships</h3>
                    <span className="text-sm text-slate-500">Every verified match sorted by relevance</span>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    {allMatching.map((scholarship) => (
                      <ScholarshipResultCard
                        key={`${scholarship.title}-${scholarship.source}`}
                        scholarship={scholarship}
                        onSave={() => handleSave(scholarship)}
                        saving={savingId === `${scholarship.title}-${scholarship.provider ?? scholarship.source}`}
                        saved={savedIds.includes(`${scholarship.title}-${scholarship.provider ?? scholarship.source}`)}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      {/* Details Modal */}
      {selectedScholarship && (
        <DetailsModal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={selectedScholarship.title}
          applicationSteps={selectedScholarship.applicationSteps || 'Please check official scholarship website for application process'}
          requiredDocuments={selectedScholarship.requiredDocuments || 'Please check official scholarship website for document requirements'}
          officialWebsite={selectedScholarship.officialWebsite}
        />
      )}
    </div>
  );
}
