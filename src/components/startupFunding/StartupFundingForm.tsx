import type { FormEvent } from 'react';
import type { StartupFundingFormValues } from '../../types/startupFunding';
import {
  INDUSTRY_OPTIONS,
  STARTUP_STAGE_OPTIONS,
  FUNDING_REQUIRED_OPTIONS,
  BUSINESS_MODEL_OPTIONS,
  STARTUP_REGISTRATION_OPTIONS,
  WOMEN_LED_OPTIONS,
  CURRENT_REVENUE_OPTIONS,
  LOOKING_FOR_OPTIONS,
  PREFERRED_LOCATION_OPTIONS,
  ADDITIONAL_PREFERENCES_OPTIONS,
} from '../../types/startupFunding';

interface StartupFundingFormProps {
  values: StartupFundingFormValues;
  onChange: (field: keyof StartupFundingFormValues, value: string | string[]) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  isReady: boolean;
  missingKeys: string[];
}

const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5';
const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:opacity-50';
const selectClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:opacity-50';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600 pt-2">{children}</p>
  );
}

export default function StartupFundingForm({
  values,
  onChange,
  onSubmit,
  loading,
  isReady,
  missingKeys,
}: StartupFundingFormProps) {
  const toggleMulti = (field: keyof StartupFundingFormValues, option: string) => {
    const current = values[field] as string[];
    const updated = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    onChange(field, updated);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">Startup details</p>
        <h2 className="mt-1 text-xl font-semibold text-gray-900">Tell us about your startup</h2>
        <p className="mt-1 text-sm text-gray-500">
          Your profile is used automatically. Fill in the startup-specific details below.
        </p>
      </div>

      <div className="rounded-xl border border-primary-100 bg-primary-50 p-3 text-sm text-primary-700">
        Your profile details such as age, qualification, occupation, industry, state, and city are reused automatically from your account.
      </div>

      {/* ── Basic info ─────────────────────────────────────────────────── */}
      <SectionHeading>Basic information</SectionHeading>

      <div>
        <label htmlFor="startupName" className={labelClass}>
          Startup name <span className="text-rose-500">*</span>
        </label>
        <input
          id="startupName"
          type="text"
          value={values.startupName}
          onChange={(e) => onChange('startupName', e.target.value)}
          placeholder="e.g. GreenLeaf Technologies"
          className={inputClass}
          disabled={loading}
          required
        />
      </div>

      <div>
        <label htmlFor="startupIdea" className={labelClass}>
          Startup idea <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="startupIdea"
          value={values.startupIdea}
          onChange={(e) => onChange('startupIdea', e.target.value)}
          placeholder="Briefly describe what your startup does and the problem it solves…"
          rows={3}
          className={`${inputClass} resize-none`}
          disabled={loading}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="industry" className={labelClass}>
            Industry <span className="text-rose-500">*</span>
          </label>
          <select
            id="industry"
            value={values.industry}
            onChange={(e) => onChange('industry', e.target.value)}
            className={selectClass}
            disabled={loading}
            required
          >
            <option value="">Select industry</option>
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="businessModel" className={labelClass}>
            Business model <span className="text-rose-500">*</span>
          </label>
          <select
            id="businessModel"
            value={values.businessModel}
            onChange={(e) => onChange('businessModel', e.target.value)}
            className={selectClass}
            disabled={loading}
            required
          >
            <option value="">Select business model</option>
            {BUSINESS_MODEL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Stage & funding ─────────────────────────────────────────────── */}
      <SectionHeading>Stage &amp; funding</SectionHeading>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startupStage" className={labelClass}>
            Startup stage <span className="text-rose-500">*</span>
          </label>
          <select
            id="startupStage"
            value={values.startupStage}
            onChange={(e) => onChange('startupStage', e.target.value)}
            className={selectClass}
            disabled={loading}
            required
          >
            <option value="">Select stage</option>
            {STARTUP_STAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="fundingRequired" className={labelClass}>
            Funding required <span className="text-rose-500">*</span>
          </label>
          <select
            id="fundingRequired"
            value={values.fundingRequired}
            onChange={(e) => onChange('fundingRequired', e.target.value)}
            className={selectClass}
            disabled={loading}
            required
          >
            <option value="">Select amount</option>
            {FUNDING_REQUIRED_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="currentRevenue" className={labelClass}>
            Current revenue <span className="text-rose-500">*</span>
          </label>
          <select
            id="currentRevenue"
            value={values.currentRevenue}
            onChange={(e) => onChange('currentRevenue', e.target.value)}
            className={selectClass}
            disabled={loading}
            required
          >
            <option value="">Select revenue stage</option>
            {CURRENT_REVENUE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="startupRegistration" className={labelClass}>
            Startup registration
          </label>
          <select
            id="startupRegistration"
            value={values.startupRegistration}
            onChange={(e) => onChange('startupRegistration', e.target.value)}
            className={selectClass}
            disabled={loading}
          >
            <option value="">Select registration status</option>
            {STARTUP_REGISTRATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Women-led ──────────────────────────────────────────────────── */}
      <div>
        <label htmlFor="womenLed" className={labelClass}>
          Women-led startup <span className="text-rose-500">*</span>
        </label>
        <select
          id="womenLed"
          value={values.womenLed}
          onChange={(e) => onChange('womenLed', e.target.value)}
          className={selectClass}
          disabled={loading}
          required
        >
          <option value="">Select an option</option>
          {WOMEN_LED_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* ── Looking for (multi-select) ─────────────────────────────────── */}
      <SectionHeading>What are you looking for? <span className="text-rose-500 normal-case font-normal">*</span></SectionHeading>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {LOOKING_FOR_OPTIONS.map((opt) => {
          const checked = values.lookingFor.includes(opt);
          return (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                checked
                  ? 'border-primary-500 bg-primary-50 font-semibold text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-primary-300 hover:bg-primary-50/50'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => toggleMulti('lookingFor', opt)}
                disabled={loading}
              />
              <span
                className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                  checked ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                }`}
                aria-hidden="true"
              >
                {checked && (
                  <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 8">
                    <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M1 4l3 3 5-6" />
                  </svg>
                )}
              </span>
              {opt}
            </label>
          );
        })}
      </div>

      {/* ── Location & preferences ────────────────────────────────────── */}
      <SectionHeading>Location &amp; preferences</SectionHeading>

      <div>
        <label htmlFor="preferredLocation" className={labelClass}>
          Preferred location
        </label>
        <select
          id="preferredLocation"
          value={values.preferredLocation}
          onChange={(e) => onChange('preferredLocation', e.target.value)}
          className={selectClass}
          disabled={loading}
        >
          {PREFERRED_LOCATION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div>
        <p className={`${labelClass} mb-2`}>Additional preferences</p>
        <div className="flex flex-wrap gap-2">
          {ADDITIONAL_PREFERENCES_OPTIONS.map((opt) => {
            const checked = values.additionalPreferences.includes(opt);
            return (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  checked
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-primary-300'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggleMulti('additionalPreferences', opt)}
                  disabled={loading}
                />
                {checked ? '✓ ' : ''}{opt}
              </label>
            );
          })}
        </div>
      </div>

      {/* ── API key warning ───────────────────────────────────────────── */}
      {!isReady && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <p className="font-semibold">Search unavailable</p>
          <p className="mt-0.5">
            Missing environment variables: <span className="font-mono">{missingKeys.join(', ')}</span>. Add them to your <span className="font-mono">.env</span> file.
          </p>
        </div>
      )}

      {/* ── Submit ────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={loading || !isReady}
        className="w-full rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Searching funding opportunities…' : 'Find Funding Opportunities'}
      </button>
    </form>
  );
}
