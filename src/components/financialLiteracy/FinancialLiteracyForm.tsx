import { useState } from 'react';
import SearchService from '../../services/search/searchService';
import type { FinancialLiteracyFormValues } from '../../types/financialLiteracy';
import {
  KNOWLEDGE_LEVELS,
  LEARNING_GOALS,
  COURSE_LEVELS,
  COURSE_FORMATS,
  BUDGET_OPTIONS,
  CERTIFICATE_PREFERENCES,
  LANGUAGE_OPTIONS,
  PLATFORM_PREFERENCES,
  FINANCIAL_LITERACY_FORM_DEFAULTS,
} from '../../types/financialLiteracy';

interface FinancialLiteracyFormProps {
  onSearch: (values: FinancialLiteracyFormValues) => void;
  isLoading: boolean;
  initialValues?: Partial<FinancialLiteracyFormValues>;
}

const selectClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600 pt-1">{children}</p>
  );
}

// Pill-style toggle for multi-select fields
function TogglePills({
  options,
  selected,
  onChange,
  disabled,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (value: string, checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const checked = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt, !checked)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
              checked
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-gray-300 bg-white text-gray-600 hover:border-primary-400 hover:text-primary-600'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function FinancialLiteracyForm({
  onSearch,
  isLoading,
  initialValues,
}: FinancialLiteracyFormProps) {
  const [values, setValues] = useState<FinancialLiteracyFormValues>(
    initialValues ? { ...FINANCIAL_LITERACY_FORM_DEFAULTS, ...initialValues } : FINANCIAL_LITERACY_FORM_DEFAULTS
  );

  const serviceReady = SearchService.isReady();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(values);
  };

  const handleSelect = (field: keyof FinancialLiteracyFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleMulti = (
    field: keyof FinancialLiteracyFormValues,
    value: string,
    checked: boolean,
  ) => {
    setValues((prev) => {
      const current = Array.isArray(prev[field]) ? (prev[field] as string[]) : [];
      if (value === 'Any') {
        return { ...prev, [field]: checked ? ['Any'] : [] };
      }
      const filtered = current.filter((i) => i !== 'Any');
      const next = checked ? [...filtered, value] : filtered.filter((i) => i !== value);
      return { ...prev, [field]: next.length > 0 ? next : ['Any'] };
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
    >
      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">
          Financial Literacy Preferences
        </p>
        <h2 className="mt-1 text-xl font-semibold text-gray-900">Find courses that fit your goals</h2>
        <p className="mt-1 text-sm text-gray-500">
          Your profile is reused automatically. Use this form to define your learning preferences.
        </p>
      </div>

      <div className="rounded-xl border border-primary-100 bg-primary-50 p-3 text-sm text-primary-700">
        Your qualification, occupation, and experience are reused automatically from your profile for personalised recommendations.
      </div>

      {!serviceReady.ready && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Search unavailable. Missing API keys: {serviceReady.missing.join(', ')}.
        </div>
      )}

      {/* Row 1 — Knowledge Level + Course Level + Budget */}
      <SectionHeading>Knowledge &amp; level</SectionHeading>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Current Knowledge Level
          </label>
          <select
            value={values.knowledgeLevel}
            onChange={(e) => handleSelect('knowledgeLevel', e.target.value)}
            disabled={isLoading}
            className={selectClass}
          >
            {KNOWLEDGE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Course Level</label>
          <select
            value={values.courseLevel}
            onChange={(e) => handleSelect('courseLevel', e.target.value)}
            disabled={isLoading}
            className={selectClass}
          >
            {COURSE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Budget</label>
          <select
            value={values.budget}
            onChange={(e) => handleSelect('budget', e.target.value)}
            disabled={isLoading}
            className={selectClass}
          >
            {BUDGET_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2 — Certificate + Language */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Certificate Preference
          </label>
          <select
            value={values.certificatePreference}
            onChange={(e) => handleSelect('certificatePreference', e.target.value)}
            disabled={isLoading}
            className={selectClass}
          >
            {CERTIFICATE_PREFERENCES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Language</label>
          <select
            value={values.language}
            onChange={(e) => handleSelect('language', e.target.value)}
            disabled={isLoading}
            className={selectClass}
          >
            {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Course Format */}
      <div>
        <SectionHeading>Course format</SectionHeading>
        <div className="mt-3">
          <TogglePills
            options={COURSE_FORMATS}
            selected={values.courseFormat}
            onChange={(v, c) => handleMulti('courseFormat', v, c)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Platform Preference */}
      <div>
        <SectionHeading>Platform preference</SectionHeading>
        <div className="mt-3">
          <TogglePills
            options={PLATFORM_PREFERENCES}
            selected={values.platformPreference}
            onChange={(v, c) => handleMulti('platformPreference', v, c)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Learning Goals — full-width pill grid */}
      <div>
        <SectionHeading>Learning goals</SectionHeading>
        <div className="mt-3 flex flex-wrap gap-2">
          {LEARNING_GOALS.map((goal) => {
            const checked = Array.isArray(values.learningGoals) && values.learningGoals.includes(goal);
            return (
              <button
                key={goal}
                type="button"
                disabled={isLoading}
                onClick={() => handleMulti('learningGoals', goal, !checked)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
                  checked
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-primary-400 hover:text-primary-600'
                }`}
              >
                {goal}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !serviceReady.ready}
        className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isLoading ? 'Searching…' : 'Find Courses'}
      </button>
    </form>
  );
}
