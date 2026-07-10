import { supabase } from './supabase/client';
import type { Application, ApplicationType } from '../types/application.types';
import type { CollegeRecommendation } from '../types';
import type { ScholarshipRecommendation } from '../types/ai.types';
import type { EducationLoanRecommendation } from '../types/educationLoan';

export interface ApplicationServiceResult<T = null> {
  data: T | null;
  error: string | null;
}

const ApplicationService = {
  /**
   * Save a college application to the applications table
   */
  async saveCollegeApplication(
    userId: string,
    college: CollegeRecommendation,
  ): Promise<ApplicationServiceResult<Application>> {
    const opportunityId = college.title || college.officialWebsite || 'unknown';
    const { data, error } = await supabase
      .from('applications')
      .insert({
        user_id: userId,
        application_type: 'college' as ApplicationType,
        opportunity_id: opportunityId,
        opportunity_title: college.title,
        status: 'draft',
        notes: `Course: ${college.courseName || college.metadata?.courseName || 'Not specified'}`,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  },

  /**
   * Save a scholarship application to the applications table
   */
  async saveScholarshipApplication(
    userId: string,
    scholarship: ScholarshipRecommendation,
  ): Promise<ApplicationServiceResult<Application>> {
    const opportunityId = scholarship.title || scholarship.applicationLink || 'unknown';
    const { data, error } = await supabase
      .from('applications')
      .insert({
        user_id: userId,
        application_type: 'scholarship' as ApplicationType,
        opportunity_id: opportunityId,
        opportunity_title: scholarship.title,
        status: 'draft',
        notes: `Provider: ${scholarship.provider || 'Not specified'} | Amount: ${scholarship.amount || 'Not specified'}`,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  },

  /**
   * Save a loan application to the applications table
   */
  async saveLoanApplication(
    userId: string,
    loan: EducationLoanRecommendation,
  ): Promise<ApplicationServiceResult<Application>> {
    const opportunityId = loan.loanSchemeName || loan.title || loan.bankName || 'unknown';
    const { data, error } = await supabase
      .from('applications')
      .insert({
        user_id: userId,
        application_type: 'loan' as ApplicationType,
        opportunity_id: opportunityId,
        opportunity_title: loan.loanSchemeName || loan.title,
        status: 'draft',
        notes: `Bank: ${loan.bankName || loan.bank || 'Not specified'} | Interest Rate: ${loan.interestRate || 'Not specified'}`,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  },

  /**
   * Get all applications for a user
   */
  async getUserApplications(userId: string): Promise<ApplicationServiceResult<Application[]>> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data || [], error: null };
  },

  /**
   * Get applications by type for a user
   */
  async getApplicationsByType(
    userId: string,
    applicationType: ApplicationType,
  ): Promise<ApplicationServiceResult<Application[]>> {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .eq('application_type', applicationType)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data || [], error: null };
  },

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: string,
    status: Application['status'],
  ): Promise<ApplicationServiceResult<Application>> {
    const { data, error } = await supabase
      .from('applications')
      .update({ status, submitted_at: status === 'submitted' ? new Date().toISOString() : null })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  },

  /**
   * Delete an application
   */
  async deleteApplication(applicationId: string): Promise<ApplicationServiceResult> {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId);

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: null, error: null };
  },
};

export default ApplicationService;
