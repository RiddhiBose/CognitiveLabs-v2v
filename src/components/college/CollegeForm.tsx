import React, { useState, useEffect, useMemo } from 'react';
import type { Profile } from '../../types';
import type { CollegeFinderFormData } from '../../types/college';
import {
  INDIAN_STATES,
  SPECIALIZATIONS,
  CATEGORY_LABELS,
  ANNUAL_INCOME_LABELS,
} from '../../constants';


interface CollegeFormProps {
  onSubmit: (formData: CollegeFinderFormData) => void;
  isLoading: boolean;
  profile: Profile | null;
}

const EXAM_GROUPS = [
  {
    category: 'Engineering',
    exams: [
      'JEE Main',
      'JEE Advanced',
      'BITSAT',
      'VITEEE',
      'WBJEE',
      'COMEDK',
      'KCET',
      'MHT CET',
      'AP EAMCET',
      'TS EAMCET',
      'KEAM',
    ],
  },
  {
    category: 'Medical',
    exams: ['NEET'],
  },
  {
    category: 'Law',
    exams: ['CLAT'],
  },
  {
    category: 'General',
    exams: ['CUET'],
  },
  {
    category: 'Architecture',
    exams: ['NATA'],
  },
  {
    category: 'Design',
    exams: ['UCEED', 'CEED', 'NIFT'],
  },
  {
    category: 'Management',
    exams: ['CAT', 'XAT', 'CMAT', 'MAT'],
  },
  {
    category: 'Other',
    exams: ['Other'],
  },
];

const EXAM_FIELDS: Record<string, { rank: boolean; score: boolean; percentile: boolean }> = {
  'JEE Main': { rank: true, score: false, percentile: true },
  'JEE Advanced': { rank: true, score: false, percentile: false },
  'BITSAT': { rank: false, score: true, percentile: false },
  'VITEEE': { rank: true, score: false, percentile: false },
  'WBJEE': { rank: true, score: false, percentile: false },
  'COMEDK': { rank: true, score: false, percentile: false },
  'KCET': { rank: true, score: false, percentile: false },
  'MHT CET': { rank: true, score: false, percentile: true },
  'AP EAMCET': { rank: true, score: false, percentile: false },
  'TS EAMCET': { rank: true, score: false, percentile: false },
  'KEAM': { rank: true, score: false, percentile: false },
  'NEET': { rank: true, score: true, percentile: true },
  'CLAT': { rank: true, score: true, percentile: false },
  'CUET': { rank: false, score: true, percentile: true },
  'NATA': { rank: false, score: true, percentile: false },
  'UCEED': { rank: true, score: true, percentile: false },
  'CEED': { rank: true, score: true, percentile: false },
  'NIFT': { rank: true, score: true, percentile: false },
  'CAT': { rank: false, score: false, percentile: true },
  'XAT': { rank: false, score: false, percentile: true },
  'CMAT': { rank: false, score: false, percentile: true },
  'MAT': { rank: false, score: false, percentile: true },
};

export const CollegeForm: React.FC<CollegeFormProps> = ({ onSubmit, isLoading, profile }) => {
  // Determine missing profile fields
  const missingQualification = !profile?.qualification;
  const missingState = !profile?.state;
  const missingCategory = !profile?.category;
  const missingAnnualIncome = !profile?.annual_income;
  const missingPwdStatus = !profile?.pwd_status;
  const missingAge = !profile?.age;

  const [formData, setFormData] = useState<CollegeFinderFormData>({
    class12Percentage: '',
    passingYear: new Date().getFullYear().toString(),
    board: 'CBSE',
    course: 'BTech',
    specialization: '',
    selectedExams: [],
    examsDetails: {},
    preferredState: 'Any State',
    budget: 'No Preference',
    collegeType: 'Any',
    hostelRequired: 'no',
    girlsOnly: 'no',
    location: 'No Preference',
    // Missing profile fields
    age: '',
    state: '',
    category: 'general',
    annual_income: 'below_2l',
    pwd_status: 'no',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state if course changes to prefill default specialization
  const specKey = formData.course.toLowerCase();
  const availableSpecs = useMemo(() => SPECIALIZATIONS[specKey] || [], [specKey]);

  useEffect(() => {
    if (availableSpecs.length > 0) {
      setFormData((prev) => ({ ...prev, specialization: availableSpecs[0] }));
    } else {
      setFormData((prev) => ({ ...prev, specialization: '' }));
    }
  }, [formData.course, availableSpecs]);

  // Handle simple input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle radio change
  const handleRadioChange = (name: string, value: 'yes' | 'no') => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle exam selection checkbox toggle
  const handleExamToggle = (exam: string) => {
    setFormData((prev) => {
      const selected = prev.selectedExams.includes(exam)
        ? prev.selectedExams.filter((e) => e !== exam)
        : [...prev.selectedExams, exam];

      // Clean or initialize details for selected exam
      const details = { ...prev.examsDetails };
      if (!selected.includes(exam)) {
        delete details[exam];
      } else if (!details[exam]) {
        details[exam] = { exam, rank: '', score: '', percentile: '' };
      }

      return {
        ...prev,
        selectedExams: selected,
        examsDetails: details,
      };
    });
  };

  // Handle exam details inputs change
  const handleExamDetailsChange = (examName: string, field: 'rank' | 'score' | 'percentile', value: string) => {
    setFormData((prev) => {
      const details = { ...prev.examsDetails };
      if (!details[examName]) {
        details[examName] = { exam: examName, rank: '', score: '', percentile: '' };
      }
      details[examName] = {
        ...details[examName],
        [field]: value,
      };
      return {
        ...prev,
        examsDetails: details,
      };
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Basic Validations
    const pct = parseFloat(formData.class12Percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setValidationError('Please enter a valid Class 12 percentage between 0 and 100.');
      return;
    }

    const year = parseInt(formData.passingYear);
    if (isNaN(year) || year < 1950 || year > new Date().getFullYear() + 5) {
      setValidationError('Please enter a valid passing year.');
      return;
    }

    // Check if any selected exam is missing all details
    for (const exam of formData.selectedExams) {
      const details = formData.examsDetails[exam];
      const fieldsConfig = EXAM_FIELDS[exam] || { rank: true, score: true, percentile: true };
      
      const requiresRank = fieldsConfig.rank;
      const requiresScore = fieldsConfig.score;
      const requiresPercentile = fieldsConfig.percentile;

      const hasRank = details?.rank?.trim();
      const hasScore = details?.score?.trim();
      const hasPercentile = details?.percentile?.trim();

      if (requiresRank && !hasRank) {
        setValidationError(`Please enter your Rank for the selected exam: ${exam}`);
        return;
      }
      if (requiresScore && !hasScore) {
        setValidationError(`Please enter your Score/Marks for the selected exam: ${exam}`);
        return;
      }
      if (requiresPercentile && !hasPercentile) {
        setValidationError(`Please enter your Percentile for the selected exam: ${exam}`);
        return;
      }
    }

    // If additional profile fields are required, validate them
    if (missingAge && (!formData.age || parseInt(formData.age) < 13 || parseInt(formData.age) > 100)) {
      setValidationError('Please enter a valid age (13 to 100).');
      return;
    }
    if (missingState && !formData.state) {
      setValidationError('Please select your current State.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {validationError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {validationError}
        </div>
      )}

      {/* 1. Academic Details Section */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-800 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
            1
          </span>
          Academic Performance (Class 12)
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Class 12 Percentage *
            </label>
            <input
              type="number"
              step="0.01"
              name="class12Percentage"
              value={formData.class12Percentage}
              onChange={handleChange}
              placeholder="e.g. 85.50"
              required
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Passing Year *
            </label>
            <input
              type="number"
              name="passingYear"
              value={formData.passingYear}
              onChange={handleChange}
              placeholder="e.g. 2024"
              required
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Board *
            </label>
            <select
              name="board"
              value={formData.board}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
            >
              <option value="CBSE">CBSE</option>
              <option value="CISCE (ISC)">CISCE (ISC)</option>
              <option value="NIOS">NIOS</option>
              <option value="All Indian State Boards">All Indian State Boards</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Desired Course *
            </label>
            <select
              name="course"
              value={formData.course}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
            >
              <option value="BTech">BTech</option>
              <option value="MBBS">MBBS</option>
              <option value="BDS">BDS</option>
              <option value="BSc">BSc</option>
              <option value="BA">BA</option>
              <option value="BCom">BCom</option>
              <option value="BCA">BCA</option>
              <option value="BBA">BBA</option>
              <option value="BPharm">BPharm</option>
              <option value="LLB">LLB</option>
              <option value="Diploma">Diploma</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Specialization / Stream
            </label>
            {availableSpecs.length > 0 ? (
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
              >
                {availableSpecs.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="e.g. Computer Science, Science, Humanities"
                className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
              />
            )}
          </div>
        </div>
      </div>

      {/* 2. Entrance Exams Section */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-800 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
            2
          </span>
          Entrance Exams
        </h3>
        
        <p className="text-xs text-gray-400 mb-4">Select all exams you have appeared for or plan to write, and enter your scores.</p>

        <div className="space-y-4">
          {EXAM_GROUPS.map((group) => (
            <div key={group.category} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                {group.category}
              </span>
              <div className="flex flex-wrap gap-2">
                {group.exams.map((exam) => {
                  const isChecked = formData.selectedExams.includes(exam);
                  return (
                    <button
                      type="button"
                      key={exam}
                      onClick={() => handleExamToggle(exam)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {exam}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Exams Detail Fields */}
        {formData.selectedExams.length > 0 && (
          <div className="mt-6 rounded-lg border border-indigo-50 bg-indigo-50/20 p-4 space-y-4">
            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
              Selected Exam Details
            </h4>
            {formData.selectedExams.map((exam) => {
              const fields = EXAM_FIELDS[exam] || { rank: true, score: true, percentile: true };
              const details = formData.examsDetails[exam] || { rank: '', score: '', percentile: '' };

              return (
                <div key={exam} className="grid grid-cols-1 gap-3 sm:grid-cols-4 items-center bg-white p-3 rounded-lg border border-indigo-100/50">
                  <div className="text-sm font-semibold text-gray-700">{exam}</div>
                  
                  {fields.rank && (
                    <div>
                      <input
                        type="text"
                        placeholder="Rank (e.g. 1542)"
                        value={details.rank}
                        onChange={(e) => handleExamDetailsChange(exam, 'rank', e.target.value)}
                        className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  )}

                  {fields.score && (
                    <div>
                      <input
                        type="text"
                        placeholder="Score/Marks (e.g. 620)"
                        value={details.score}
                        onChange={(e) => handleExamDetailsChange(exam, 'score', e.target.value)}
                        className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  )}

                  {fields.percentile && (
                    <div>
                      <input
                        type="text"
                        placeholder="Percentile (e.g. 98.45)"
                        value={details.percentile}
                        onChange={(e) => handleExamDetailsChange(exam, 'percentile', e.target.value)}
                        className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. User Preferences Section */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-gray-800 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
            3
          </span>
          Admission & College Preferences
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Preferred State
            </label>
            <select
              name="preferredState"
              value={formData.preferredState}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
            >
              <option value="Any State">Any State</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Budget (Annual Tuition Fee)
            </label>
            <select
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
            >
              <option value="No Preference">No Preference</option>
              <option value="Below ₹1 Lakh">Below ₹1 Lakh</option>
              <option value="₹1–3 Lakh">₹1–3 Lakh</option>
              <option value="₹3–5 Lakh">₹3–5 Lakh</option>
              <option value="₹5–8 Lakh">₹5–8 Lakh</option>
              <option value="₹8–12 Lakh">₹8–12 Lakh</option>
              <option value="Above ₹12 Lakh">Above ₹12 Lakh</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              College Type
            </label>
            <select
              name="collegeType"
              value={formData.collegeType}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
            >
              <option value="Any">Any Type</option>
              <option value="Government">Government Only</option>
              <option value="Private">Private Only</option>
              <option value="Deemed">Deemed University</option>
              <option value="State University">State University</option>
              <option value="Central University">Central University</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Hostel Accommodation
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="hostelRequired"
                  checked={formData.hostelRequired === 'yes'}
                  onChange={() => handleRadioChange('hostelRequired', 'yes')}
                  className="accent-indigo-600"
                />
                Required
              </label>
              <label className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="hostelRequired"
                  checked={formData.hostelRequired === 'no'}
                  onChange={() => handleRadioChange('hostelRequired', 'no')}
                  className="accent-indigo-600"
                />
                Not Required
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Girls-only College
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="girlsOnly"
                  checked={formData.girlsOnly === 'yes'}
                  onChange={() => handleRadioChange('girlsOnly', 'yes')}
                  className="accent-indigo-600"
                />
                Yes
              </label>
              <label className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="girlsOnly"
                  checked={formData.girlsOnly === 'no'}
                  onChange={() => handleRadioChange('girlsOnly', 'no')}
                  className="accent-indigo-600"
                />
                No Preference
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Geographic Location
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-indigo-500 focus:bg-white"
            >
              <option value="No Preference">No Preference</option>
              <option value="Urban">Urban</option>
              <option value="Semi Urban">Semi Urban</option>
              <option value="Rural">Rural</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Missing Profile Details (Only shown if missing in Supabase profile) */}
      {(missingQualification || missingState || missingCategory || missingAnnualIncome || missingPwdStatus || missingAge) && (
        <div className="rounded-xl border border-yellow-100 bg-yellow-50/30 p-5 shadow-sm">
          <h3 className="mb-2 text-base font-semibold text-yellow-800 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-800">
              4
            </span>
            Profile Information
          </h3>
          <p className="text-xs text-yellow-700 mb-4">
            We noticed some details are missing from your account profile. To find best match scholarships/criteria, please fill them in.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {missingAge && (
              <div>
                <label className="block text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="e.g. 18"
                  className="w-full rounded-lg border border-yellow-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-yellow-500"
                />
              </div>
            )}

            {missingState && (
              <div>
                <label className="block text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1">
                  Current State
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-yellow-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-yellow-500"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {missingCategory && (
              <div>
                <label className="block text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1">
                  Reservation Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-yellow-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-yellow-500"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {missingAnnualIncome && (
              <div>
                <label className="block text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1">
                  Family Annual Income
                </label>
                <select
                  name="annual_income"
                  value={formData.annual_income}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-yellow-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-yellow-500"
                >
                  {Object.entries(ANNUAL_INCOME_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {missingPwdStatus && (
              <div>
                <label className="block text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-2">
                  PWD (Persons with Disability) Status
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="pwd_status"
                      checked={formData.pwd_status === 'yes'}
                      onChange={() => handleRadioChange('pwd_status', 'yes')}
                      className="accent-yellow-600"
                    />
                    Yes
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="pwd_status"
                      checked={formData.pwd_status === 'no'}
                      onChange={() => handleRadioChange('pwd_status', 'no')}
                      className="accent-yellow-600"
                    />
                    No
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Finding Colleges...
            </>
          ) : (
            'Find Colleges'
          )}
        </button>
      </div>
    </form>
  );
};

export default CollegeForm;
