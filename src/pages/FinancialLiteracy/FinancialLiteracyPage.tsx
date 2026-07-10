import { useState, useEffect } from 'react';
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
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="text-sm text-slate-600 mb-2">AI financial education</div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              Find verified financial literacy courses
            </h1>
            <p className="text-lg text-slate-600">
              Your profile details are reused automatically for eligibility, while the search
              goal section defines the course level, topics and platform you want to discover.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-1">
              <FinancialLiteracyForm onSearch={handleSearch} isLoading={loading} />
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
              {loading && (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full mb-4" />
                  <p className="text-slate-600">{loadingMessages[currentMessageIndex]}</p>
                </div>
              )}

              {error && !loading && <ErrorMessage message={error} />}

              {!loading && searchAttempted && results.length === 0 && !error && (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <p className="text-slate-600">
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
      </div>
    </>
  );
}
