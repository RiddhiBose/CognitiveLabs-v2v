import type { FormEvent } from 'react';
import {
  APPLICATION_STATUS_OPTIONS,
  FUNDING_COVERAGE_OPTIONS,
  MAXIMUM_DISTANCE_OPTIONS,
  SCHOLARSHIP_EDUCATION_LEVELS,
  SCHOLARSHIP_TYPES,
  STUDY_LOCATION_OPTIONS,
  type ScholarshipFormValues,
} from '../../types/scholarship';

interface ScholarshipFinderFormProps {
  values: ScholarshipFormValues;
  onChange: (field: keyof ScholarshipFormValues, value: string | string[]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  isReady: boolean;
  missingKeys: string[];
}

function ToggleGroup({
  label,
  options,
  selectedValues,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selectedValues: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selectedValues.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${checked ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-violet-400 hover:text-violet-600'}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ScholarshipFinderForm({
  values,
  onChange,
  onSubmit,
  loading,
  isReady,
  missingKeys,
}: ScholarshipFinderFormProps) {
  const toggleOption = (field: 'scholarshipTypes' | 'fundingCoverage', value: string) => {
    const current = values[field];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    if (value === 'Any') {
      onChange(field, ['Any']);
      return;
    }

    const filtered = next.filter((item) => item !== 'Any');
    onChange(field, filtered.length > 0 ? filtered : ['Any']);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">Scholarship preferences</p>
        <h2 className="text-xl font-semibold text-slate-900">Discover every verified scholarship that fits your goals</h2>
        <p className="text-sm text-slate-600">Your current profile is reused automatically for eligibility, while this form defines the scholarship goal you want to search for.</p>
      </div>

      {!isReady && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Scholarship search is currently unavailable because these keys are missing: {missingKeys.join(', ')}.
        </div>
      )}

      <div className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-sm text-violet-700">
        Current profile details such as qualification, degree, semester, category, income, gender, state and PWD status are reused automatically from your account.
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">Scholarship Goal</p>
          <p className="text-sm text-slate-600">Use the current profile for eligibility and this section for the scholarship you want to search for.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Target Education Level</span>
            <select
              value={values.targetEducationLevel}
              onChange={(event) => onChange('targetEducationLevel', event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
            >
              {SCHOLARSHIP_EDUCATION_LEVELS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Target Degree (optional)</span>
            <input
              value={values.targetDegree}
              onChange={(event) => onChange('targetDegree', event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-0 focus:border-violet-500"
              placeholder="e.g. MTech, MBA, MSc"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Target Specialization (optional)</span>
          <input
            value={values.targetSpecialization}
            onChange={(event) => onChange('targetSpecialization', event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-0 focus:border-violet-500"
            placeholder="e.g. AI, Data Science, Public Health"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Study Location</span>
            <select
              value={values.studyLocation}
              onChange={(event) => onChange('studyLocation', event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
            >
              {STUDY_LOCATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Preferred Country (optional)</span>
            <input
              value={values.preferredCountry}
              onChange={(event) => onChange('preferredCountry', event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-0 focus:border-violet-500"
              placeholder="e.g. Japan, Germany, USA"
            />
          </label>
        </div>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Institution Name (optional)</span>
        <input
          value={values.institutionName}
          onChange={(event) => onChange('institutionName', event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none ring-0 focus:border-violet-500"
          placeholder="e.g. Indian Institute of Technology"
        />
      </label>

      <ToggleGroup
        label="Scholarship Type"
        options={SCHOLARSHIP_TYPES}
        selectedValues={values.scholarshipTypes}
        onChange={(value) => toggleOption('scholarshipTypes', value)}
      />

      <ToggleGroup
        label="Funding Coverage"
        options={FUNDING_COVERAGE_OPTIONS}
        selectedValues={values.fundingCoverage}
        onChange={(value) => toggleOption('fundingCoverage', value)}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Application Status</span>
          <select
            value={values.applicationStatus}
            onChange={(event) => onChange('applicationStatus', event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
          >
            {APPLICATION_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Maximum Distance</span>
          <select
            value={values.maximumDistance}
            onChange={(event) => onChange('maximumDistance', event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
          >
            {MAXIMUM_DISTANCE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !isReady}
        className="inline-flex items-center rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {loading ? 'Searching…' : 'Find scholarships'}
      </button>
    </form>
  );
}
