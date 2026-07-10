import { useState, type FormEvent } from 'react';
import type { ProfileStep4, AnnualIncome, Category, PwdStatus } from '../../../types';
import { ANNUAL_INCOME_LABELS, CATEGORY_LABELS, INDIAN_STATES } from '../../../constants';
import { useDebounce } from '../../../hooks/useDebounce';

interface Props {
  initialData: ProfileStep4 | null;
  onComplete: (data: ProfileStep4) => void;
  onBack: () => void;
}

export default function Step4Background({ initialData, onComplete, onBack }: Props) {
  const [annualIncome, setAnnualIncome] = useState<AnnualIncome | ''>(
    initialData?.annual_income ?? '',
  );
  const [category, setCategory] = useState<Category | ''>(initialData?.category ?? '');
  const [pwdStatus, setPwdStatus] = useState<PwdStatus | ''>(initialData?.pwd_status ?? '');
  const [state, setState] = useState(initialData?.state ?? '');
  const [stateSearch, setStateSearch] = useState(initialData?.state ?? '');
  const [city, setCity] = useState(initialData?.city ?? '');
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const debouncedSearch = useDebounce(stateSearch, 200);

  const filteredStates = debouncedSearch
    ? INDIAN_STATES.filter((s) =>
        s.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : INDIAN_STATES;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!annualIncome) e.annualIncome = 'Please select your annual family income.';
    if (!category) e.category = 'Please select your category.';
    if (!pwdStatus) e.pwdStatus = 'Please select your PWD status.';
    if (!state) e.state = 'Please select your state.';
    if (!city.trim()) e.city = 'Please enter your city.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onComplete({
      annual_income: annualIncome as AnnualIncome,
      category: category as Category,
      pwd_status: pwdStatus as PwdStatus,
      state,
      city: city.trim(),
    });
  };

  const handleStateSelect = (selectedState: string) => {
    setState(selectedState);
    setStateSearch(selectedState);
    setShowStateSuggestions(false);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Background Information</h3>
        <p className="text-sm text-gray-500">
          This information helps us show you relevant scholarships and government schemes.
        </p>
      </div>

      {/* Annual Income */}
      <div>
        <label htmlFor="annualIncome" className="mb-1 block text-sm font-medium text-gray-700">
          Annual Family Income <span className="text-red-500">*</span>
        </label>
        <select
          id="annualIncome"
          value={annualIncome}
          onChange={(e) => setAnnualIncome(e.target.value as AnnualIncome | '')}
          className={`w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400 ${
            errors.annualIncome ? 'border-red-400' : 'border-gray-300'
          }`}
        >
          <option value="">Select income range</option>
          {Object.entries(ANNUAL_INCOME_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errors.annualIncome && <p className="mt-1 text-xs text-red-600">{errors.annualIncome}</p>}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category | '')}
          className={`w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400 ${
            errors.category ? 'border-red-400' : 'border-gray-300'
          }`}
        >
          <option value="">Select category</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
      </div>

      {/* PWD Status */}
      <div>
        <label htmlFor="pwdStatus" className="mb-1 block text-sm font-medium text-gray-700">
          Person with Disability (PWD) <span className="text-red-500">*</span>
        </label>
        <select
          id="pwdStatus"
          value={pwdStatus}
          onChange={(e) => setPwdStatus(e.target.value as PwdStatus | '')}
          className={`w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400 ${
            errors.pwdStatus ? 'border-red-400' : 'border-gray-300'
          }`}
        >
          <option value="">Select</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
        {errors.pwdStatus && <p className="mt-1 text-xs text-red-600">{errors.pwdStatus}</p>}
      </div>

      {/* State — searchable dropdown */}
      <div className="relative">
        <label htmlFor="stateSearch" className="mb-1 block text-sm font-medium text-gray-700">
          State / Union Territory <span className="text-red-500">*</span>
        </label>
        <input
          id="stateSearch"
          type="text"
          value={stateSearch}
          onChange={(e) => {
            setStateSearch(e.target.value);
            setState('');
            setShowStateSuggestions(true);
          }}
          onFocus={() => setShowStateSuggestions(true)}
          onBlur={() => setTimeout(() => setShowStateSuggestions(false), 150)}
          className={`w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400 ${
            errors.state ? 'border-red-400' : 'border-gray-300'
          }`}
          placeholder="Search state..."
          autoComplete="off"
        />
        {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
        {showStateSuggestions && filteredStates.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-md">
            {filteredStates.map((s) => (
              <li
                key={s}
                onMouseDown={() => handleStateSelect(s)}
                className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50"
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* City */}
      <div>
        <label htmlFor="city" className="mb-1 block text-sm font-medium text-gray-700">
          City <span className="text-red-500">*</span>
        </label>
        <input
          id="city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={`w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-400 ${
            errors.city ? 'border-red-400' : 'border-gray-300'
          }`}
          placeholder="Your city"
        />
        {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
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
          className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Next &rarr;
        </button>
      </div>
    </form>
  );
}
