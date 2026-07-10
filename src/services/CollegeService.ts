import { supabase } from './supabase/client';
import SearchService from './search/searchService';
import SavedItemsService from './SavedItemsService';
import type {
  UserProfileForSearch,
  CollegeRecommendation,
  SearchResponse,
} from '../types';
import type { CollegeFinderFormData } from '../types/college';

export interface CollegeServiceResult<T = null> {
  data: T | null;
  error: string | null;
}

const PREFERRED_DOMAINS = [
  'josaa.nic.in',
  'csab.nic.in',
  'nta.ac.in',
  'ugc.gov.in',
  'aicte-india.org',
  'official university websites',
  'official counselling websites',
];

export const CollegeService = {
  /**
   * Run the AI search recommendation flow for colleges.
   */
  async recommendColleges(
    userId: string,
    profile: UserProfileForSearch,
    formData: CollegeFinderFormData,
  ): Promise<SearchResponse<CollegeRecommendation>> {
    console.log('[CollegeService] recommendColleges called');
    // 1. Prepare feature-specific input
    const examsList = formData.selectedExams.map((examName) => {
      const details = formData.examsDetails[examName];
      return {
        exam: examName,
        rank: details?.rank || 'Not specified',
        score: details?.score || 'Not specified',
        percentile: details?.percentile || 'Not specified',
      };
    });

    const featureInput = {
      course: formData.course + (formData.specialization ? ` (${formData.specialization})` : ''),
      state: formData.preferredState || 'Any State',
      entranceExam:
        examsList
          .map(
            (e) =>
              `${e.exam} (Rank: ${e.rank}, Score: ${e.score}, Percentile: ${e.percentile})`,
          )
          .join(', ') || 'None',
      budget: formData.budget || 'No Preference',
      collegeType: formData.collegeType || 'Any',
      hostelRequired: formData.hostelRequired || 'no',
      girlsOnly: formData.girlsOnly || 'no',
      location: formData.location || 'No Preference',
      class12Percentage: formData.class12Percentage,
      passingYear: formData.passingYear,
      board: formData.board,
    };

    console.log('[CollegeService] featureInput:', featureInput);
    console.log('[CollegeService] calling SearchService.search with params:', {
      type: 'college',
      profile,
      featureInput,
      preferredDomains: PREFERRED_DOMAINS,
      maxResults:10,
    });

    // 2. Call SearchService.search()
    const response = await SearchService.search<CollegeRecommendation>({
      type: 'college',
      profile,
      featureInput,
      preferredDomains: PREFERRED_DOMAINS,
      maxResults: 10,
    });

    console.log('[CollegeService] SearchService response:', response);

    // 3. If successful, save search history in background (don't block the UI)
    if (response.results && response.results.length > 0 && !response.cached) {
      this.saveSearchHistory(userId, response.query, formData, response.results.length).catch(
        (err) => console.error('Error saving search history:', err),
      );
    }

    return response;
  },

  // ── Saved Colleges (Supabase saved_items) ─────────────────────────────────

  async saveCollege(
    userId: string,
    college: CollegeRecommendation,
  ): Promise<CollegeServiceResult> {
    const res = await SavedItemsService.save({
      userId,
      itemType: 'college',
      itemId: college.title,
      itemTitle: college.title,
      itemMetadata: {
        officialWebsite: college.officialWebsite ?? null,
        courseName: college.courseName ?? (college.metadata?.courseName as string) ?? null,
        savedAt: new Date().toISOString(),
      },
      snapshot: college as unknown as Record<string, unknown>,
    });
    if (res.error) return { data: null, error: res.error };
    return { data: null, error: null };
  },

  async unsaveCollege(userId: string, collegeName: string): Promise<CollegeServiceResult> {
    const { error } = await supabase
      .from('saved_items')
      .delete()
      .eq('user_id', userId)
      .eq('item_type', 'college')
      .eq('item_id', collegeName);

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: null, error: null };
  },

  async isCollegeSaved(userId: string, collegeName: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', userId)
      .eq('item_type', 'college')
      .eq('item_id', collegeName)
      .maybeSingle();

    if (error || !data) return false;
    return true;
  },

  async getSavedColleges(userId: string): Promise<CollegeServiceResult<any[]>> {
    const { data, error } = await supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', userId)
      .eq('item_type', 'college')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data || [], error: null };
  },

  // ── Search History (Supabase search_history) ──────────────────────────────

  async saveSearchHistory(
    userId: string,
    query: string,
    formData: CollegeFinderFormData,
    resultsCount: number,
  ): Promise<CollegeServiceResult> {
    const filters = {
      course: formData.course,
      exams: formData.selectedExams,
      preferredState: formData.preferredState,
      inputs: {
        class12Percentage: formData.class12Percentage,
        passingYear: formData.passingYear,
        board: formData.board,
        specialization: formData.specialization,
        examsDetails: formData.examsDetails,
        budget: formData.budget,
        collegeType: formData.collegeType,
        hostelRequired: formData.hostelRequired,
        girlsOnly: formData.girlsOnly,
        location: formData.location,
      },
    };

    const { error } = await supabase.from('search_history').insert({
      user_id: userId,
      query,
      category: 'college',
      filters,
      results_count: resultsCount,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: null, error: null };
  },

  async getSearchHistory(userId: string, limit = 10): Promise<CollegeServiceResult<any[]>> {
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .eq('category', 'college')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data || [], error: null };
  },
};

export default CollegeService;
