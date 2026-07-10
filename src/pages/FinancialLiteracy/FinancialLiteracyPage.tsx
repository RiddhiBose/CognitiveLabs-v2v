import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import FinancialLiteracyForm from '../../components/financialLiteracy/FinancialLiteracyForm.tsx';
import FinancialLiteracyResults from '../../components/financialLiteracy/FinancialLiteracyResults.tsx';
import SearchService from '../../services/search/searchService';
import FinancialLiteracyService from '../../services/FinancialLiteracyService';
import type {
  FinancialLiteracySearchResponse,
  FinancialLiteracyFormValues,
} from '../../types/financialLiteracy';
import ErrorMessage from '../../components/common/ErrorMessage';
import LoadingScreen from '../../components/common/LoadingScreen';

export default function FinancialLiteracyPage() {
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();
  const prefill = (location.state as { prefill?: Partial<FinancialLiteracyFormValues> } | null)?.prefill;

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchDurationMs, setSearchDurationMs] = useState(0);
  const [resultCount, setResultCount] = useState(0);
  const [cached, setCached] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const loadingMessages = [
    'Searching official learning platforms...',
    'Gathering verified financial literacy courses...',
    'Comparing course quality and fit...',
    'Ranking recommendations by match score...',
    'Preparing results...',
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [loading]);

  const handleSearch = async (values: FinancialLiteracyFormValues) => {
    if (!profile?.user_id) {
      setError('User profile not available. Please log in again.');
      return;
    }

    const serviceReady = SearchService.isReady();
    if (!serviceReady.ready) {
      setError(
        `Financial literacy search is temporarily unavailable. Missing services: ${serviceReady.missing.join(', ')}`
      );
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setSearchAttempted(true);

    try {
      const response: FinancialLiteracySearchResponse =
        await FinancialLiteracyService.searchCourses({
          profile,
          formValues: values,
        });

      setSearchDurationMs(response.searchDurationMs);
      setResultCount(response.totalFound);
      setCached(response.cached);

      if (response.error) {
        setError(response.error);
        setResults([]);
      } else {
        setResults(response.results || []);
        if (response.results.length === 0) {
          setError('No matching financial literacy courses found. Try adjusting your filters.');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setResults([]);
    } finally {
      setLoading(false);
      setCurrentMessageIndex(0);
    }
  };

  if (profileLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center pr-10 text-9xl">📚</div>
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Financial Literacy</h1>
            <p className="mt-2 text-sm text-primary-100">
              AI-powered recommendations for verified financial literacy courses from official platforms
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Form */}
          <FinancialLiteracyForm onSearch={handleSearch} isLoading={loading} initialValues={prefill} />

          {/* Results */}
          <div>
            {loading && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-primary-100 border-t-primary-600 rounded-full mb-4" />
                <p className="text-gray-600">{loadingMessages[currentMessageIndex]}</p>
              </div>
            )}

            {error && !loading && <ErrorMessage message={error} />}

            {!loading && searchAttempted && results.length === 0 && !error && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 text-center">
                <p className="text-gray-600">
                  No courses found matching your criteria. Try adjusting your preferences.
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <FinancialLiteracyResults
                results={results}
                searchDurationMs={searchDurationMs}
                totalFound={resultCount}
                cached={cached}
              />
            )}
          </div>
        </div>
    </div>
  );
}
