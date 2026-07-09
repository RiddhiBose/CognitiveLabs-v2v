import { useState, type FormEvent } from 'react';
import type { ProfileStep2, Qualification } from '../../../types';
import { QUALIFICATION_LABELS, SPECIALIZATIONS } from '../../../constants';

interface Props {
  initialData: ProfileStep2 | null;
  onComplete: (data: ProfileStep2) => void;
  onBack: () => void;
}

const QUALIFICATIONS_WITH_NO_SPEC = ['class_10', 'class_12'];

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
  const [errors, setErrors] = useState<{ qualification?: string; specialization?: string; specializationOther?: string }>({});

  const specializationOptions = qualification ? SPECIALIZATIONS[qualification] ?? [] : [];
  const showSpecialization =
    qualification &&
    !QUALIFICATIONS_WITH_NO_SPEC.includes(qualification) &&
    specializationOptions.length > 0;
  const showSpecOther = specialization === 'Other';
  const showQualOther = qualification === 'other';

  const validate = (): boolean => {
    const e: typeof errors = {};
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

      {/* Other qualification text */}
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

      {/* Other specialization text */}
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
