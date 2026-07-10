import { useState, useEffect } from 'react';
import {
  MENTOR_OCCUPATIONS,
  MENTOR_JOB_ROLES,
  PREFERRED_DEGREES,
  BRANCHES_BY_DEGREE,
  PREFERRED_MIN_EXPERIENCE_OPTIONS,
} from '../../constants';
import type { LearnerPreferences, LearnerPreferencesInput } from '../../types';

interface Props {
  existing: LearnerPreferences | null;
  onSave: (input: LearnerPreferencesInput) => Promise<void>;
  saving: boolean;
}

const EMPTY: LearnerPreferencesInput = {
  preferred_occupation: '',
  preferred_job_role: '',
  preferred_degree: '',
  preferred_branch: '',
  preferred_min_experience: 0,
};

export default function LearnerPreferenceForm({ existing, onSave, saving }: Props) {
  const [form, setForm] = useState<LearnerPreferencesInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setForm({
        preferred_occupation: existing.preferred_occupation ?? '',
        preferred_job_role: existing.preferred_job_role ?? '',
        preferred_degree: existing.preferred_degree ?? '',
        preferred_branch: existing.preferred_branch ?? '',
        preferred_min_experience: existing.preferred_min_experience ?? 0,
      });
    }
  }, [existing]);

  const branches = form.preferred_degree ? (BRANCHES_BY_DEGREE[form.preferred_degree] ?? []) : [];

  const set = (field: keyof LearnerPreferencesInput, value: string | number) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'preferred_degree') next.preferred_branch = '';
      return next;
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.preferred_occupation) { setError('Please select a preferred mentor occupation.'); return; }
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

        {/* Preferred Occupation */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Preferred Mentor Occupation <span className="text-red-500">*</span>
          </label>
          <select
            value={form.preferred_occupation}
            onChange={(e) => set('preferred_occupation', e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Select occupation</option>
            {MENTOR_OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Preferred Job Role */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Preferred Mentor Job Role
          </label>
          <select
            value={form.preferred_job_role}
            onChange={(e) => set('preferred_job_role', e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">No preference</option>
            {MENTOR_JOB_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Preferred Degree */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Preferred Mentor Degree
          </label>
          <select
            value={form.preferred_degree}
            onChange={(e) => set('preferred_degree', e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">No preference</option>
            {PREFERRED_DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Preferred Branch — dynamic */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Preferred Mentor Branch / Specialization
          </label>
          <select
            value={form.preferred_branch}
            onChange={(e) => set('preferred_branch', e.target.value)}
            disabled={branches.length === 0}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
          >
            <option value="">
              {branches.length === 0 ? 'Select a degree first' : 'No preference'}
            </option>
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Min Experience */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Preferred Minimum Experience
          </label>
          <select
            value={form.preferred_min_experience}
            onChange={(e) => set('preferred_min_experience', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {PREFERRED_MIN_EXPERIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-xs text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60 transition-colors cursor-pointer"
      >
        {saving ? 'Saving…' : existing ? 'Update Preferences & Find Mentors' : 'Save Preferences & Find Mentors'}
      </button>
    </form>
  );
}
