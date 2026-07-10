import { useState, type FormEvent } from 'react';
import type { ProfileStep2, Qualification } from '../../../types';
import { QUALIFICATION_LABELS, SPECIALIZATIONS } from '../../../constants';

interface Props {
  initialData: ProfileStep2 | null;
  onComplete: (data: ProfileStep2) => void;
  onBack: () => void;
}

const QUALIFICATIONS_WITH_NO_SPEC = ['class_10', 'class_12'];

// Qualifications that imply the user attended a college/university
const COLLEGE_QUALIFICATIONS = [
  'diploma', 'iti', 'ba', 'bsc', 'bcom', 'bba', 'bca', 'btech', 'be',
  'mbbs', 'bds', 'bpharm', 'llb', 'mba', 'mca', 'mtech', 'msc', 'ma',
  'mcom', 'phd', 'other',
];

export default function Step2Academic({ initialData, onComplete, onBack }: Props) {
  const [qualification, setQualification] = useState<Qualification | ''>(
    initialData?.qualification ?? '',
  );
  const [qualificationOther, setQualificationOther] = useState(
    initialData?.qualification_other ?? '',
  );
  const [specialization, setSpecialization] = useState(initialData?.specialization ?? '');
  const [specializationOther, setSpecializationOther] = useState(
    initialData?.specialization_other ?? '',
  );
  const [collegeName, setCollegeName] = useState(initialData?.college_name ?? '');
  const [schoolName, setSchoolName] = useState(initialData?.school_name ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const specializationOptions = qualification ? SPECIALIZATIONS[qualification] ?? [] : [];
  const showSpecialization =
    qualification &&
    !QUALIFICATIONS_WITH_NO_SPEC.includes(qualification) &&
    specializationOptions.length > 0;
  const showSpecOther = specialization === 'Other';
  const showQualOther = qualification === 'other';
  const showCollegeField = qualification ? COLLEGE_QUALIFICATIONS.includes(qualification) : false;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!qualification) e.qualification = 'Please select your highest qualification.';
    if (qualification === 'other' && !qualificationOther.trim()) {
      e.qualification = 'Please specify your qualification.';
    }
    if (showSpecialization && !specialization) {
      e.specialization = 'Please select your specialization.';
    }
    if (showSpecOther && !specializationOther.trim()) {
      e.specializationOther = 'Please specify your specialization.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onComplete({
      qualification: qualification as Qualification,
      qualification_other: showQualOther ? qualificationOther : undefined,
      specialization: showSpecialization ? specialization : undefined,
      specialization_other: showSpecOther ? specializationOther : undefined,
      college_name: showCollegeField && collegeName.trim() ? collegeName.trim() : undefined,
      school_name: schoolName.trim() ? schoolName.trim() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Academic Information</h3>
        <p className="text-sm text-gray-500">Tell us about your educational background.</p>
      </div>

      {/* Qualification */}
      <div>
        <label htmlFor="qualification" className="mb-1 block text-sm font-medium text-gray-700">
          Highest Qualification <span className="text-red-500">*</span>
        </label>
        <select
          id="qualification"
          value={qualification}
          onChange={(e) => {
            setQualification(e.target.value as Qualification | '');
            setSpecialization('');
            setSpecializationOther('');
          }}
          className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${
            errors.qualification ? 'border-red-400' : 'border-gray-300'
          }`}
        >
          <option value="">Select qualification</option>
          {Object.entries(QUALIFICATION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errors.qualification && (
          <p className="mt-1 text-xs text-red-600">{errors.qualification}</p>
        )}
      </div>

      {/* Other qualification */}
      {showQualOther && (
        <div>
          <label htmlFor="qualOther" className="mb-1 block text-sm font-medium text-gray-700">
            Specify Qualification <span className="text-red-500">*</span>
          </label>
          <input
            id="qualOther"
            type="text"
            value={qualificationOther}
            onChange={(e) => setQualificationOther(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Enter your qualification"
          />
        </div>
      )}

      {/* Specialization */}
      {showSpecialization && (
        <div>
          <label htmlFor="specialization" className="mb-1 block text-sm font-medium text-gray-700">
            Specialization <span className="text-red-500">*</span>
          </label>
          <select
            id="specialization"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${
              errors.specialization ? 'border-red-400' : 'border-gray-300'
            }`}
          >
            <option value="">Select specialization</option>
            {specializationOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.specialization && (
            <p className="mt-1 text-xs text-red-600">{errors.specialization}</p>
          )}
        </div>
      )}

      {/* Other specialization */}
      {showSpecOther && (
        <div>
          <label htmlFor="specOther" className="mb-1 block text-sm font-medium text-gray-700">
            Specify Specialization <span className="text-red-500">*</span>
          </label>
          <input
            id="specOther"
            type="text"
            value={specializationOther}
            onChange={(e) => setSpecializationOther(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${
              errors.specializationOther ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="Enter your specialization"
          />
          {errors.specializationOther && (
            <p className="mt-1 text-xs text-red-600">{errors.specializationOther}</p>
          )}
        </div>
      )}

      {/* College / University name — shown for degree-level qualifications */}
      {showCollegeField && (
        <div>
          <label htmlFor="collegeName" className="mb-1 block text-sm font-medium text-gray-700">
            College / University Name
            <span className="ml-1 text-xs text-gray-400 font-normal">(Optional — used for mentor matching)</span>
          </label>
          <input
            id="collegeName"
            type="text"
            value={collegeName}
            onChange={(e) => setCollegeName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="e.g. IIT Bombay, Anna University, BITS Pilani"
          />
          <p className="mt-1 text-xs text-gray-400">
            Mentors from the same college are ranked higher in your recommendations.
          </p>
        </div>
      )}

      {/* School name — shown for everyone */}
      <div>
        <label htmlFor="schoolName" className="mb-1 block text-sm font-medium text-gray-700">
          School Name
          <span className="ml-1 text-xs text-gray-400 font-normal">(Optional — used for mentor matching)</span>
        </label>
        <input
          id="schoolName"
          type="text"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="e.g. Kendriya Vidyalaya, DAV Public School"
        />
        <p className="mt-1 text-xs text-gray-400">
          Mentors who attended the same school are ranked higher in your recommendations.
        </p>
      </div>

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
