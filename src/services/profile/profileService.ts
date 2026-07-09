import { supabase } from '../supabase/client';
import type { Profile, PublicProfile } from '../../types';
import { parseError } from '../../utils/errorHandler';
import { MENTOR_EXPERIENCE_THRESHOLD } from '../../constants';

export interface ProfileServiceResult<T = null> {
  data: T | null;
  error: string | null;
}

const ProfileService = {
  /**
   * Fetch the full profile of the currently authenticated user.
   */
  async getMyProfile(userId: string): Promise<ProfileServiceResult<Profile>> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as Profile, error: null };
  },

  /**
   * Fetch a public profile by user_id.
   */
  async getPublicProfile(userId: string): Promise<ProfileServiceResult<PublicProfile>> {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, user_id, full_name, role, qualification, qualification_other, specialization, occupation, experience, state, city, bio, avatar_url',
      )
      .eq('user_id', userId)
      .single();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as PublicProfile, error: null };
  },

  /**
   * Create a new profile after signup.
   */
  async createProfile(
    userId: string,
    email: string,
    profileData: Partial<Profile>,
  ): Promise<ProfileServiceResult<Profile>> {
    const role = ProfileService.determineRole(
      profileData.occupation ?? null,
      profileData.experience ?? null,
    );

    const payload = {
      ...profileData,
      user_id: userId,
      email,
      role,
      is_profile_complete: false,
    };

    const { data, error } = await supabase.from('profiles').insert(payload).select().single();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as Profile, error: null };
  },

  /**
   * Update an existing profile.
   */
  async updateProfile(
    userId: string,
    updates: Partial<Profile>,
  ): Promise<ProfileServiceResult<Profile>> {
    // Recalculate role if occupation or experience changes
    const role = ProfileService.determineRole(
      updates.occupation ?? null,
      updates.experience ?? null,
    );

    const payload = {
      ...updates,
      role,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return { data: null, error: parseError(error) };

    // If role is mentor, ensure mentor record exists
    if (role === 'mentor' && data) {
      await ProfileService.upsertMentorRecord(userId, data as Profile);
    }

    return { data: data as Profile, error: null };
  },

  /**
   * Mark profile as complete.
   */
  async markProfileComplete(userId: string): Promise<ProfileServiceResult<Profile>> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_profile_complete: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return { data: null, error: parseError(error) };
    return { data: data as Profile, error: null };
  },

  /**
   * Upsert mentor record when role is mentor.
   */
  async upsertMentorRecord(
    userId: string,
    profile: Profile,
  ): Promise<ProfileServiceResult> {
    const mentorPayload = {
      user_id: userId,
      experience: profile.experience ?? 0,
      industry: profile.industry ?? null,
      company: profile.company ?? null,
      bio: profile.bio ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('mentors')
      .upsert(mentorPayload, { onConflict: 'user_id' });

    if (error) return { data: null, error: parseError(error) };
    return { data: null, error: null };
  },

  /**
   * Determine user role based on occupation and experience.
   * - Student → always Learner
   * - Experience >= threshold → Mentor
   * - Otherwise → Learner
   */
  determineRole(
    occupation: string | null,
    experience: number | null,
  ): 'learner' | 'mentor' {
    if (occupation === 'student') return 'learner';
    if (experience !== null && experience >= MENTOR_EXPERIENCE_THRESHOLD) return 'mentor';
    return 'learner';
  },

  /**
   * Check if a profile exists for a user.
   */
  async profileExists(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error || !data) return false;
    return true;
  },
};

export default ProfileService;
