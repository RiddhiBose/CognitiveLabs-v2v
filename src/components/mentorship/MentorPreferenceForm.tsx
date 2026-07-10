import { useState, useEffect } from 'react';
import {
  PREFERRED_DEGREES,
  BRANCHES_BY_DEGREE,
  PREFERRED_LEARNER_OCCUPATIONS,
  COMMUNICATION_LANGUAGES,
} from '../../constants';
import type { MentorPreferences, MentorPreferencesInput } from '../../types';

interface Props {
  existing: MentorPreferences | null;
  onSave: (input: MentorPreferencesInput) => Promise<void>;
  saving: boolean;
}

const EMPTY: MentorPreferencesInput = {
  preferred_learner_occupation: '',
  preferred_learner_age_min: null,
  preferred_learner_age_max: null,
  preferred_degree: '',
  preferred_branch: '',
  max_active_mentees: 5,
  preferred_language: 'English',
};

export default function MentorPreferenceForm({ existing, onSave, saving }: Props) {
  const [form, setForm] = useState<MentorPreferencesInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setForm({
        preferred_learner_occupation: existing.preferred_learner_occupation ?? '',
        preferred_learner_age_min: existing.preferred_learner_age_min ?? null,
        preferred_learner_age_max: existing.preferred_learner_age_max ?? null,
        preferred_degree: existing.preferred_degree ?? '',
        preferred_branch: existing.preferred_branch ?? '',
        max_active_mentees: existing.max_active_mentees ?? 5,
        preferred_language: existing.preferred_language ?? 'English',
      });
    }
  }, [existing]);

  const branches = form.preferred_degree ? (BRANCHES_BY_DEGREE[form.preferred_degree] ?? []) : [];

  const setField = (field: keyof MentorPreferencesInput, value: string | number | null) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value } as MentorPreferencesInput;
      if (field === 'preferred_degree') next.preferred_branch = '';
      return next;
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ageMin = form.preferred_learner_age_min;
    const ageMax = form.preferred_learner_age_max;
    if (ageMin !== null && ageMax !== null && ageMin > ageMax) {
      setError('Minimum age cannot be greater than maximum age.');
      return;
    }
    if (form.max_active_mentees < 1 || form.max_active_mentees > 50) {
      setError('Maximum active mentees must be between 1 and 50.');
      return;
    }
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

        {/* Preferred Learner Occupation */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Preferred Learner Occupation
          </label>
          <select
            value={form.preferred_learner_occupation}
            onChange={(e) => setField('preferred_learner_occupation', e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">No preference</option>
            {PREFERRED_LEARNER_OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Learner Age Range */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Preferred Learner Age — Minimum
          </label>
          <input
            type="number"
            min={13}
            max={80}
            placeholder="e.g. 18"
            value={form.preferred_learner_age_min ?? ''}
            onChange={(e) => setField('preferred_learner_age_min', e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Preferred Learner Age — Maximum
          </label>
          <input
            type="number"
            min={13}
            max={80}
            placeholder="e.g. 30"
            value={form.preferred_learner_age_max ?? ''}
            onChange={(e) => setField('preferred_learner_age_max', e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Preferred Degree */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Preferred Learner Degree
          </label>
          <select
            value={form.preferred_degree}
            onChange={(e) => setField('preferred_degree', e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">No preference</option>
            {PREFERRED_DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Preferred Branch */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Preferred Learner Branch / Specialization
          </label>
          <select
            value={form.preferred_branch}
            onChange={(e) => setField('preferred_branch', e.target.value)}
            disabled={branches.length === 0}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
          >
            <option value="">
              {branches.length === 0 ? 'Select a degree first' : 'No preference'}
            </option>
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Max Active Mentees */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Maximum Active Mentees
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={form.max_active_mentees}
            onChange={(e) => setField('max_active_mentees', Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-xs text-gray-400">Maximum number of learners you can mentor simultaneously.</p>
        </div>

        {/* Preferred Communication Language */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Preferred Communication Language
          </label>
          <select
            value={form.preferred_language}
            onChange={(e) => setField('preferred_language', e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {COMMUNICATION_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
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
        {saving ? 'Saving…' : existing ? 'Update Preferences' : 'Save Preferences'}
      </button>
    </form>
  );
}
