// LoanForm — multi-section eligibility form for the Education Loan Finder
// Pure presentational component: receives state + callbacks from parent page.
// No AI calls, no Supabase calls.

import React from 'react';
import type {
  LoanFormData,
  LoanFormErrors,
  CourseType,
  StudyLevel,
  AdmissionStatus,
  StudyDestination,
  AbroadCountry,
  EducationCostRange,
  RepaymentPreference,
  CollateralAvailability,
  CoapplicantType,
  PreferredBankType,
  InterestRatePreference,
} from '../../types/educationLoan';

// ── Option lists ──────────────────────────────────────────────────────────────

const COURSES: CourseType[] = [
  'BTech', 'MBBS', 'BDS', 'BCA', 'BBA', 'BCom', 'BA', 'BSc',
  'MSc', 'MBA', 'MTech', 'LLB', 'Diploma', 'PhD', 'Other',
];

const STUDY_LEVELS: StudyLevel[] = [
  'Undergraduate', 'Postgraduate', 'Doctorate', 'Diploma',
];

const ADMISSION_STATUSES: AdmissionStatus[] = [
  'Already Admitted', 'Admission Offer Received', 'Applying', 'Yet to Apply',
];

const ABROAD_COUNTRIES: AbroadCountry[] = [
  'USA', 'Canada', 'UK', 'Germany', 'Australia', 'Japan', 'Singapore', 'Other',
];

const COST_RANGES: EducationCostRange[] = [
  'Below ₹5 Lakh', '₹5–10 Lakh', '₹10–20 Lakh', '₹20–50 Lakh', 'Above ₹50 Lakh',
];

const REPAYMENT_PREFERENCES: RepaymentPreference[] = [
  'Lowest EMI', 'Lowest Interest Rate', 'Flexible Repayment', 'Longer Tenure', 'No Preference',
];

const COLLATERAL_OPTIONS: CollateralAvailability[] = ['Yes', 'No', 'Unsure'];

const COAPPLICANT_OPTIONS: CoapplicantType[] = ['Parent', 'Guardian', 'Spouse', 'None'];

const BANK_TYPES: PreferredBankType[] = [
  'Public Sector Bank', 'Private Bank', 'NBFC', 'Any',
];

const INTEREST_RATE_PREFS: InterestRatePreference[] = [
  'Lowest Available', 'Fixed Rate', 'Floating Rate', 'No Preference',
];

// ── Sub-components ────────────────────────────────────────────────────────────

interface SectionHeadingProps {
  number: number;
  title: string;
  subtitle?: string;
}

function SectionHeading({ number, title, subtitle }: SectionHeadingProps) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
        {number}
      </span>
      <div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

function FieldWrapper({ label, required, error, children, hint }: FieldWrapperProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  hasError?: boolean;
}

function Select({ value, onChange, options, placeholder = 'Select…', hasError }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        hasError
          ? 'border-red-400 bg-red-50'
          : 'border-gray-300 bg-white text-gray-800'
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}

function ToggleRow({ label, checked, onChange, description }: ToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 hover:bg-indigo-50 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <div>
        <span className="text-sm font-medium text-gray-800">{label}</span>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </label>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface LoanFormProps {
  form: LoanFormData;
  errors: LoanFormErrors;
  loading: boolean;
  onChange: (field: keyof LoanFormData, value: string | boolean | number) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export default function LoanForm({
  form,
  errors,
  loading,
  onChange,
  onSubmit,
  onReset,
}: LoanFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-6">
        {/* ── Section 1: Academic Details ───────────────────────────────────── */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <SectionHeading
            number={1}
            title="Academic Details"
            subtitle="Tell us about the course you plan to pursue"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Course */}
            <FieldWrapper label="Course" required error={errors.course}>
              <Select
                value={form.course}
                onChange={(v) => onChange('course', v)}
                options={COURSES}
                placeholder="Select course…"
                hasError={!!errors.course}
              />
            </FieldWrapper>

            {/* Course Other */}
            {form.course === 'Other' && (
              <FieldWrapper label="Specify Course" required error={errors.course}>
                <input
                  type="text"
                  value={form.courseOther}
                  onChange={(e) => onChange('courseOther', e.target.value)}
                  placeholder="e.g. BPT, B.Arch, BHM…"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldWrapper>
            )}

            {/* Study Level */}
            <FieldWrapper label="Study Level" required error={errors.studyLevel}>
              <Select
                value={form.studyLevel}
                onChange={(v) => onChange('studyLevel', v)}
                options={STUDY_LEVELS}
                placeholder="Select level…"
                hasError={!!errors.studyLevel}
              />
            </FieldWrapper>

            {/* College Name */}
            <FieldWrapper
              label="College / University Name"
              hint="Leave blank if not yet decided"
            >
              <input
                type="text"
                value={form.collegeName}
                onChange={(e) => onChange('collegeName', e.target.value)}
                placeholder="e.g. IIT Delhi, AIIMS, etc."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </FieldWrapper>

            {/* Admission Status */}
            <FieldWrapper label="Admission Status">
              <Select
                value={form.admissionStatus}
                onChange={(v) => onChange('admissionStatus', v)}
                options={ADMISSION_STATUSES}
                placeholder="Select status…"
              />
            </FieldWrapper>

            {/* Study Destination */}
            <FieldWrapper label="Study Destination" required error={errors.studyDestination}>
              <Select
                value={form.studyDestination}
                onChange={(v) => onChange('studyDestination', v)}
                options={['India', 'Abroad'] satisfies StudyDestination[]}
                placeholder="Select destination…"
                hasError={!!errors.studyDestination}
              />
            </FieldWrapper>

            {/* Country (only if Abroad) */}
            {form.studyDestination === 'Abroad' && (
              <FieldWrapper label="Country" hint="Select the country you plan to study in">
                <Select
                  value={form.abroadCountry}
                  onChange={(v) => onChange('abroadCountry', v)}
                  options={ABROAD_COUNTRIES}
                  placeholder="Select country…"
                />
              </FieldWrapper>
            )}
          </div>
        </div>

        {/* ── Section 2: Financial Details ──────────────────────────────────── */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <SectionHeading
            number={2}
            title="Financial Details"
            subtitle="Help us find the most affordable loan options for you"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Estimated Cost */}
            <FieldWrapper
              label="Estimated Total Education Cost"
              required
              error={errors.estimatedCost}
            >
              <Select
                value={form.estimatedCost}
                onChange={(v) => onChange('estimatedCost', v)}
                options={COST_RANGES}
                placeholder="Select cost range…"
                hasError={!!errors.estimatedCost}
              />
            </FieldWrapper>

            {/* Loan Amount */}
            <FieldWrapper
              label="Loan Amount Required (in Lakhs)"
              error={errors.loanAmountRequired}
              hint="Enter 10 for ₹10 Lakh, 25 for ₹25 Lakh, etc."
            >
              <input
                type="number"
                min={1}
                max={5000}
                step={0.5}
                value={form.loanAmountRequired}
                onChange={(e) =>
                  onChange(
                    'loanAmountRequired',
                    e.target.value === '' ? '' : parseFloat(e.target.value),
                  )
                }
                placeholder="e.g. 15"
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.loanAmountRequired ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
            </FieldWrapper>

            {/* Repayment Preference */}
            <FieldWrapper label="Repayment Preference">
              <Select
                value={form.repaymentPreference}
                onChange={(v) => onChange('repaymentPreference', v)}
                options={REPAYMENT_PREFERENCES}
                placeholder="Select preference…"
              />
            </FieldWrapper>

            {/* Collateral */}
            <FieldWrapper label="Collateral Available" required error={errors.collateralAvailable}>
              <Select
                value={form.collateralAvailable}
                onChange={(v) => onChange('collateralAvailable', v)}
                options={COLLATERAL_OPTIONS}
                placeholder="Select…"
                hasError={!!errors.collateralAvailable}
              />
            </FieldWrapper>

            {/* Co-applicant */}
            <FieldWrapper label="Co-applicant Available" required error={errors.coapplicant}>
              <Select
                value={form.coapplicant}
                onChange={(v) => onChange('coapplicant', v)}
                options={COAPPLICANT_OPTIONS}
                placeholder="Select…"
                hasError={!!errors.coapplicant}
              />
            </FieldWrapper>
          </div>

          {/* Toggle rows */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToggleRow
              label="Need Moratorium Period"
              checked={form.needMoratorium}
              onChange={(v) => onChange('needMoratorium', v)}
              description="Repayment holiday during course + 6–12 months after"
            />
            <ToggleRow
              label="Need Female Applicant Benefits"
              checked={form.needFemaleBenefits}
              onChange={(v) => onChange('needFemaleBenefits', v)}
              description="Interest concessions available for women borrowers"
            />
          </div>
        </div>

        {/* ── Section 3: Loan Preferences ───────────────────────────────────── */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <SectionHeading
            number={3}
            title="Loan Preferences"
            subtitle="Narrow down the type of loan that suits you"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Bank Type */}
            <FieldWrapper label="Preferred Bank Type">
              <Select
                value={form.preferredBankType}
                onChange={(v) => onChange('preferredBankType', v)}
                options={BANK_TYPES}
                placeholder="Select bank type…"
              />
            </FieldWrapper>

            {/* Interest Rate Pref */}
            <FieldWrapper label="Interest Rate Preference">
              <Select
                value={form.interestRatePreference}
                onChange={(v) => onChange('interestRatePreference', v)}
                options={INTEREST_RATE_PREFS}
                placeholder="Select preference…"
              />
            </FieldWrapper>
          </div>

          <div className="mt-4">
            <ToggleRow
              label="Need Government-Supported / Subsidised Loan"
              checked={form.needGovernmentLoan}
              onChange={(v) => onChange('needGovernmentLoan', v)}
              description="Includes Vidya Lakshmi, CSIS, Dr. Ambedkar schemes, etc."
            />
          </div>
        </div>

        {/* ── Actions ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onReset}
            disabled={loading}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden="true"
                />
                Searching…
              </>
            ) : (
              <>
                <span aria-hidden="true">🔍</span>
                Find Education Loans
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
