import { useState, type FormEvent } from 'react';
import type { ProfileStep1, Gender } from '../../../types';
import { GENDER_LABELS } from '../../../constants';

interface Props {
  initialData: ProfileStep1 | null;
  onComplete: (data: ProfileStep1) => void;
}

export default function Step1Personal({ initialData, onComplete }: Props) {
  const [fullName, setFullName] = useState(initialData?.full_name ?? '');
  const [age, setAge] = useState<string>(initialData?.age?.toString() ?? '');
  const [gender, setGender] = useState<Gender | ''>(initialData?.gender ?? '');
  const [errors, setErrors] = useState<{ fullName?: string; age?: string }>({});

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!fullName.trim() || fullName.trim().length < 2) e.fullName = 'Full name must be at least 2 characters.';
    if (age && (isNaN(Number(age)) || Number(age) < 13 || Number(age) > 100)) {
      e.age = 'Please enter a valid age between 13 and 100.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onComplete({
      full_name: fullName.trim(),
      age: age ? Number(age) : null,
      gender: gender || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
        <p className="text-sm text-gray-500">Tell us a bit about yourself.</p>
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-gray-700">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400 ${
            errors.fullName ? 'border-red-400' : 'border-gray-300'
          }`}
          placeholder="Your full name"
        />
        {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
      </div>

      {/* Age */}
      <div>
        <label htmlFor="age" className="mb-1 block text-sm font-medium text-gray-700">
          Age
        </label>
        <input
          id="age"
          type="number"
          min={13}
          max={100}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${
            errors.age ? 'border-red-400' : 'border-gray-300'
          }`}
          placeholder="Your age"
        />
        {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age}</p>}
      </div>

      {/* Gender */}
      <div>
        <label htmlFor="gender" className="mb-1 block text-sm font-medium text-gray-700">
          Gender <span className="text-gray-400 text-xs">(Optional)</span>
        </label>
        <select
          id="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender | '')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">Prefer not to say</option>
          {Object.entries(GENDER_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-700"
      >
        Next &rarr;
      </button>
    </form>
  );
}
