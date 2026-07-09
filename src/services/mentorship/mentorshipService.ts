/**
 * MentorshipService
 *
 * Handles mentor-learner connection requests.
 * Full matching logic will be implemented in a future phase.
 */

import { supabase } from '../supabase/client';
import type { MentorshipRequest, MentorshipRequestStatus } from '../../types';
import { parseError } from '../../utils/errorHandler';

export interface MentorshipServiceResult<T = null> {
  data: T | null;
  error: string | null;
}

const MentorshipService = {
  /**
   * Send a mentorship request from learner to mentor.
   */
  async sendRequest(
    mentorId: string,
    learnerId: string,
    message?: string,
  ): Promise<MentorshipServiceResult<MentorshipRequest>> {
    const { data, error } = await supabase
      .from('mentorship_requests')
      .insert({
        mentor_id: mentorId,
        learner_id: learnerId,
        message: message ?? null,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as MentorshipRequest, error: null };
  },

  /**
   * Update a mentorship request status (accept/reject).
   */
  async updateRequestStatus(
    requestId: string,
    status: MentorshipRequestStatus,
  ): Promise<MentorshipServiceResult<MentorshipRequest>> {
    const { data, error } = await supabase
      .from('mentorship_requests')
      .update({
        status,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as MentorshipRequest, error: null };
  },

  /**
   * Get mentorship requests received by a mentor.
   */
  async getReceivedRequests(mentorId: string): Promise<MentorshipServiceResult<MentorshipRequest[]>> {
    const { data, error } = await supabase
      .from('mentorship_requests')
      .select('*')
      .eq('mentor_id', mentorId)
      .order('requested_at', { ascending: false });

    if (error) return { data: null, error: parseError(error) };
    return { data: data as MentorshipRequest[], error: null };
  },

  /**
   * Get mentorship requests sent by a learner.
   */
  async getSentRequests(learnerId: string): Promise<MentorshipServiceResult<MentorshipRequest[]>> {
    const { data, error } = await supabase
      .from('mentorship_requests')
      .select('*')
      .eq('learner_id', learnerId)
      .order('requested_at', { ascending: false });

    if (error) return { data: null, error: parseError(error) };
    return { data: data as MentorshipRequest[], error: null };
  },

  /**
   * Get all available mentors — full AI matching will be added in a future phase.
   */
  async getAvailableMentors(_filters?: Record<string, unknown>): Promise<MentorshipServiceResult<unknown[]>> {
    // TODO: Add AI-based matching in Phase 2
    const { data, error } = await supabase
      .from('mentors')
      .select('*, profiles(full_name, state, city, avatar_url)')
      .order('rating', { ascending: false });

    if (error) return { data: null, error: parseError(error) };
    return { data: data ?? [], error: null };
  },
};

export default MentorshipService;
