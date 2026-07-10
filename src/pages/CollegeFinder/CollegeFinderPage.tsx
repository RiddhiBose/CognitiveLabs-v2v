import { useState, useEffect } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import { LoadingScreen } from '../../components/common';
import DetailsModal from '../../components/common/DetailsModal';
import SearchService from '../../services/search/searchService';
import CollegeService from '../../services/CollegeService';
import ApplicationService from '../../services/ApplicationService';
import { CollegeForm, CollegeResultCard } from '../../components/college';
import type { CollegeRecommendation, CollegeFinderFormData } from '../../types/college';
import type { UserProfileForSearch } from '../../types';

const LOADING_STEPS = [
  'Searching official sources...',
  'Analyzing colleges...',
  'Ranking recommendations...',
  'Preparing results...',
];

export default function CollegeFinderPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [isSearching, setIsSearching] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [colleges, setColleges] = useState<CollegeRecommendation[]>([]);
  const [savedColleges, setSavedColleges] = useState<string[]>([]);
  const [savingName, setSavingName] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchWarning, setSearchWarning] = useState<string | null>(null);
  const [isConfigError, setIsConfigError] = useState(false);
  const [configMissingKeys, setConfigMissingKeys] = useState<string[]>([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<CollegeRecommendation | null>(null);

  // Check if keys are ready on mount
  useEffect(() => {
    const status = SearchService.isReady();
    if (!status.ready) {
      setIsConfigError(true);
      setConfigMissingKeys(status.missing);
    }
  }, []);

  // Load saved colleges and search history when profile is available
  useEffect(() => {
    if (profile?.user_id) {
      loadSavedColleges(profile.user_id);
      loadHistory(profile.user_id);
    }
  }, [profile?.user_id]);

  // Handle cycling of loading step text
  useEffect(() => {
    let interval: any;
    if (isSearching) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => {
          if (prev < LOADING_STEPS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const loadSavedColleges = async (userId: string) => {
    const res = await CollegeService.getSavedColleges(userId);
    if (!res.error && res.data) {
      setSavedColleges(res.data.map((item) => item.item_id));
    }
  };

  const loadHistory = async (userId: string) => {
    const res = await CollegeService.getSearchHistory(userId);
    if (!res.error && res.data) {
      setSearchHistory(res.data);
    }
  };

  const executeSearch = async (form: CollegeFinderFormData) => {
    console.log('[CollegeFinder] executeSearch called with form:', form);
    if (!profile?.user_id) {
      setErrorMsg('You must be logged in to search colleges.');
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);
    setSearchWarning(null);
    setColleges([]);

    try {
      // Build profile representation fallback to form inputs for missing profile details
      const profileForSearch: UserProfileForSearch = {
        full_name: profile.full_name || 'Guest',
        role: profile.role || 'learner',
        qualification: profile.qualification || form.course || null,
        qualification_other: profile.qualification_other || null,
        specialization: profile.specialization || form.specialization || null,
        occupation: profile.occupation || null,
        experience: profile.experience || null,
        annual_income: profile.annual_income || form.annual_income || null,
        category: profile.category || form.category || null,
        pwd_status: profile.pwd_status || form.pwd_status || null,
        state: profile.state || form.state || null,
        city: profile.city || null,
        bio: profile.bio || null,
      };

      console.log('[CollegeFinder] profileForSearch:', profileForSearch);

      const response = await CollegeService.recommendColleges(
        profile.user_id,
        profileForSearch,
        form,
      );
      console.log('[CollegeFinder] CollegeService response:', response);

      if (response.error) {
        console.error('[CollegeFinder] CollegeService returned error:', response.error);
        setErrorMsg(response.error);
      } else if (!response.results || response.results.length === 0) {
        console.warn('[CollegeFinder] No results');
        setErrorMsg('No matching colleges were found. Try adjusting your entrance exam scores or budget filters.');
      } else {
        setColleges(response.results);
        if (response.warning) {
          setSearchWarning(response.warning);
        }
        // Refresh history
        loadHistory(profile.user_id);
      }
    } catch (err: any) {
      console.error('[CollegeFinder] Search failed caught:', err);
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveToggle = async (college: CollegeRecommendation) => {
    if (!profile?.user_id) return;
    const isCurrentlySaved = savedColleges.includes(college.title);

    setSavingName(college.title);
    if (isCurrentlySaved) {
      const res = await CollegeService.unsaveCollege(profile.user_id, college.title);
      if (!res.error) {
        setSavedColleges((prev) => prev.filter((name) => name !== college.title));
      } else {
        console.error('Failed to unsave', res.error);
      }
    } else {
      const res = await CollegeService.saveCollege(
        profile.user_id,
        college.title,
        college.officialWebsite || null,
        college.courseName || (college.metadata?.courseName as string) || null,
      );
      if (!res.error) {
        setSavedColleges((prev) => [...prev, college.title]);
      } else {
        console.error('Failed to save', res.error);
      }
    }
    setSavingName(null);
  };

  const handleApply = async (college: CollegeRecommendation) => {
    if (!profile?.user_id) return;
    const res = await ApplicationService.saveCollegeApplication(profile.user_id, college);
    if (!res.error) {
      console.log('Application saved successfully');
    } else {
      console.error('Failed to save application', res.error);
    }
  };

  const handleViewDetails = (college: CollegeRecommendation) => {
    setSelectedCollege(college);
    setDetailsModalOpen(true);
  };

  const handleReRunSearch = async (historyItem: any) => {
    const f = historyItem.filters;
    if (!f) return;

    const reconstructedForm: CollegeFinderFormData = {
      class12Percentage: f.inputs?.class12Percentage || '',
      passingYear: f.inputs?.passingYear || new Date().getFullYear().toString(),
      board: f.inputs?.board || 'CBSE',
      course: f.course || 'BTech',
      specialization: f.inputs?.specialization || '',
      selectedExams: f.exams || [],
      examsDetails: f.inputs?.examsDetails || {},
      preferredState: f.preferredState || 'Any State',
      budget: f.inputs?.budget || 'No Preference',
      collegeType: f.inputs?.collegeType || 'Any',
      hostelRequired: f.inputs?.hostelRequired || 'no',
      girlsOnly: f.inputs?.girlsOnly || 'no',
      location: f.inputs?.location || 'No Preference',
    };

    await executeSearch(reconstructedForm);
  };

  if (profileLoading) return <LoadingScreen />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-900 to-indigo-700 p-6 text-white shadow-sm relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center pr-10 text-9xl">🏛️</div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AI College Finder</h1>
          <p className="mt-2 text-sm text-indigo-100">
            Find the best matching universities in India using real-time search grounding and customized recommendation algorithms based on your academic score, entrance exams, and preferences.
          </p>
        </div>
      </div>

      {isConfigError && (
        <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <span className="font-bold">⚠️ AI Service Keys Missing:</span> The following environment variables are not configured:
          <ul className="list-disc list-inside mt-1 font-semibold">
            {configMissingKeys.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
          Please verify your <code className="bg-yellow-100 px-1 rounded">.env</code> file. Searches will fail until this is resolved.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Side: Search Form (takes 3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Main search card */}
          {!isSearching && colleges.length === 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-800">Profile & Preferences</h2>
              <CollegeForm
                onSubmit={executeSearch}
                isLoading={isSearching}
                profile={profile}
              />
            </div>
          )}

          {/* Loader View */}
          {isSearching && (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative flex items-center justify-center mb-6">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
                <span className="absolute text-xl">🏛️</span>
              </div>
              <h3 className="text-lg font-bold text-indigo-900 animate-pulse transition-all duration-300">
                {LOADING_STEPS[loadingStepIndex]}
              </h3>
              <p className="text-xs text-gray-400 mt-2 text-center max-w-sm">
                Our AI Agent is browsing official counseling domains and comparing matching eligibility. Please hold tight.
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <h3 className="text-sm font-bold text-red-800 mb-1 flex items-center gap-1.5">
                ❌ Search Failed
              </h3>
              <p className="text-xs text-red-700 leading-relaxed mb-4">{errorMsg}</p>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setColleges([]);
                }}
                className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
              >
                Back to Search Form
              </button>
            </div>
          )}

          {/* Results Grid */}
          {!isSearching && colleges.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Recommended Colleges</h2>
                  <p className="text-xs text-gray-500">Based on your score, eligibility, budget, and state preferences.</p>
                </div>
                <button
                  onClick={() => setColleges([])}
                  className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  ← Modify Search
                </button>
              </div>

              {searchWarning && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-3 text-xs text-yellow-800">
                  💡 {searchWarning}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {colleges.map((college, idx) => (
                  <CollegeResultCard
                    key={`${college.title}-${idx}`}
                    college={college}
                    isSaved={savedColleges.includes(college.title)}
                    onSaveToggle={() => handleSaveToggle(college)}
                    saving={savingName === college.title}
                    onApply={handleApply}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Search History (takes 1 col) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <span>⏱️</span> Recent Searches
            </h3>
            {searchHistory.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No search history recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {searchHistory.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleReRunSearch(item)}
                    className="group rounded-lg border border-gray-100 p-3 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all cursor-pointer text-left"
                  >
                    <div className="font-bold text-xs text-gray-700 group-hover:text-indigo-700 flex items-center justify-between">
                      <span>{item.filters?.course || 'Course Not Specified'}</span>
                      <span className="text-[10px] text-gray-400 font-medium font-mono">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {item.filters?.exams && item.filters.exams.length > 0 && (
                      <p className="text-[10px] text-gray-500 mt-1 truncate">
                        Exams: {item.filters.exams.join(', ')}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                      State: {item.filters?.preferredState || 'Any'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-indigo-50 bg-indigo-50/20 p-5">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-1">
              Live Grounded Search
            </h4>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              We aggregate from sources like <span className="font-semibold">JoSAA</span>, <span className="font-semibold">CSAB</span>, <span className="font-semibold">NTA</span>, <span className="font-semibold">UGC</span>, and AICTE to deliver accurate recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedCollege && (
        <DetailsModal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={selectedCollege.title}
          applicationSteps={selectedCollege.applicationSteps || 'Please check official college website for application process'}
          requiredDocuments={selectedCollege.requiredDocuments || 'Please check official college website for document requirements'}
          officialWebsite={selectedCollege.officialWebsite}
        />
      )}
    </div>
  );
}
