import { useState, type FormEvent } from 'react';
import type { ProfileStep3, Occupation, EmploymentType } from '../../../types';
import { OCCUPATION_LABELS, EMPLOYMENT_TYPE_LABELS } from '../../../constants';

interface Props {
  initialData: ProfileStep3 | null;
  onComplete: (data: ProfileStep3) => void;
  onBack: () => void;
}

export default function Step3Occupation({ initialData, onComplete, onBack }: Props) {
  const [occupation, setOccupation] = useState<Occupation | ''>(
    initialData?.occupation ?? '',
  );
  const [occupationOther, setOccupationOther] = useState(initialData?.occupation_other ?? '');
  const [experience, setExperience] = useState<string>(
    initialData?.experience?.toString() ?? '',
  );
  const [jobTitle, setJobTitle] = useState(initialData?.job_title ?? '');
  const [company, setCompany] = useState(initialData?.company ?? '');
  const [industry, setIndustry] = useState(initialData?.industry ?? '');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>(
    initialData?.employment_type ?? '',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isStudent = occupation === 'student';
  const showWorkFields = occupation && !isStudent;
  const showOccupationOther = occupation === 'other';

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!occupation) e.occupation = 'Please select your occupation.';
    if (showOccupationOther && !occupationOther.trim()) e.occupationOther = 'Please specify your occupation.';
    if (showWorkFields) {
      if (!experience || isNaN(Number(experience)) || Number(experience) < 0) {
        e.experience = 'Please enter a valid number of years of experience.';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onComplete({
      occupation: occupation as Occupation,
      occupation_other: showOccupationOther ? occupationOther : undefined,
      experience: isStudent ? null : experience ? Number(experience) : null,
      job_title: showWorkFields ? jobTitle || null : null,
      company: showWorkFields ? company || null : null,
      industry: showWorkFields ? industry || null : null,
      employment_type: showWorkFields ? (employmentType as EmploymentType) || null : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Occupation</h3>
        <p className="text-sm text-gray-500">Tell us about your professional background.</p>
      </div>

      {/* Occupation */}
      <div>
        <label htmlFor="occupation" className="mb-1 block text-sm font-medium text-gray-700">
          Current Occupation <span className="text-red-500">*</span>
        </label>
        <select
          id="occupation"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value as Occupation | '')}
          className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${
            errors.occupation ? 'border-red-400' : 'border-gray-300'
          }`}
        >
          <option value="">Select occupation</option>
          {Object.entries(OCCUPATION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errors.occupation && <p className="mt-1 text-xs text-red-600">{errors.occupation}</p>}
      </div>

      {/* Other occupation */}
      {showOccupationOther && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Specify Occupation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={occupationOther}
            onChange={(e) => setOccupationOther(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Enter your occupation"
          />
          {errors.occupationOther && (
            <p className="mt-1 text-xs text-red-600">{errors.occupationOther}</p>
          )}
        </div>
      )}

      {/* Student notice */}
      {isStudent && (
        <div className="rounded-md bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          You will be assigned the <strong>Learner</strong> role.
        </div>
      )}

      {/* Work fields for non-students */}
      {showWorkFields && (
        <>
          {/* Years of experience */}
          <div>
            <label htmlFor="experience" className="mb-1 block text-sm font-medium text-gray-700">
              Years of Experience <span className="text-red-500">*</span>
            </label>
            <input
              id="experience"
              type="number"
              min={0}
              max={60}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${
                errors.experience ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            {errors.experience && (
              <p className="mt-1 text-xs text-red-600">{errors.experience}</p>
            )}
            {experience && Number(experience) >= 5 && (
              <p className="mt-1 text-xs text-indigo-600">
                Based on your experience, you will be assigned the <strong>Mentor</strong> role.
              </p>
            )}
          </div>

          {/* Job Title */}
          <div>
            <label htmlFor="jobTitle" className="mb-1 block text-sm font-medium text-gray-700">
              Current Job Title
            </label>
            <input
              id="jobTitle"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="e.g. Software Engineer"
            />
          </div>

          {/* Company */}
          <div>
            <label htmlFor="company" className="mb-1 block text-sm font-medium text-gray-700">
              Organization / Company
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="e.g. Infosys"
            />
          </div>

          {/* Industry */}
          <div>
            <label htmlFor="industry" className="mb-1 block text-sm font-medium text-gray-700">
              Industry / Domain
            </label>
            <input
              id="industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="e.g. Technology"
            />
          </div>

          {/* Employment Type */}
          <div>
            <label htmlFor="employmentType" className="mb-1 block text-sm font-medium text-gray-700">
              Employment Type
            </label>
            <select
              id="employmentType"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EmploymentType | '')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Select type</option>
              {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          &larr; Back
        </button>
        <button
          type="submit"
          className="flex-1 rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Next &rarr;
        </button>
      </div>
    </form>
  );
}
