import { useState } from 'react';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingScreen, ErrorMessage, SuccessMessage, EmptyState, Spinner } from '../../components/common';
import { QUALIFICATION_LABELS, OCCUPATION_LABELS, ANNUAL_INCOME_LABELS, CATEGORY_LABELS, GENDER_LABELS, INDIAN_STATES } from '../../constants';
import { countWords, BIO_MAX_WORDS } from '../../utils';
import type { Profile, Gender, AnnualIncome, Category, PwdStatus } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit form state
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [bio, setBio] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [state, setState] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [city, setCity] = useState('');
  const [annualIncome, setAnnualIncome] = useState<AnnualIncome | ''>('');
  const [category, setCategory] = useState<Category | ''>('');
  const [pwdStatus, setPwdStatus] = useState<PwdStatus | ''>('');
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);

  const debouncedSearch = useDebounce(stateSearch, 200);
  const filteredStates = debouncedSearch
    ? INDIAN_STATES.filter((s) => s.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : INDIAN_STATES;

  const wordCount = countWords(bio);
  const isOverBioLimit = wordCount > BIO_MAX_WORDS;

  if (loading) return <LoadingScreen />;

  if (!profile) {
    return (
      <EmptyState
        message="Profile not found."
        description="Complete your profile to get started."
      />
    );
  }

  const startEditing = () => {
    setFullName(profile.full_name);
    setAge(profile.age?.toString() ?? '');
    setGender(profile.gender ?? '');
    setBio(profile.bio ?? '');
    setJobTitle(profile.job_title ?? '');
    setCompany(profile.company ?? '');
    setIndustry(profile.industry ?? '');
    setState(profile.state ?? '');
    setStateSearch(profile.state ?? '');
    setCity(profile.city ?? '');
    setAnnualIncome(profile.annual_income ?? '');
    setCategory(profile.category ?? '');
    setPwdStatus(profile.pwd_status ?? '');
    setError(null);
    setSuccess(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (isOverBioLimit) {
      setError(`Bio must be within ${BIO_MAX_WORDS} words.`);
      return;
    }

    setSaving(true);
    const updates: Partial<Profile> = {
      full_name: fullName.trim(),
      age: age ? Number(age) : null,
      gender: gender || null,
      bio: bio.trim() || null,
      job_title: jobTitle.trim() || null,
      company: company.trim() || null,
      industry: industry.trim() || null,
      state: state || null,
      city: city.trim() || null,
      annual_income: annualIncome || null,
      category: category || null,
      pwd_status: pwdStatus || null,
    };

    const result = await updateProfile(updates);
    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Profile updated successfully.');
      setIsEditing(false);
    }
  };

  // --- View mode ---
  if (!isEditing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Profile</h1>
            <button
              onClick={startEditing}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50"
            >
              Edit Profile
            </button>
          </div>
        </div>

        <SuccessMessage message={success} className="mb-4" />

        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          {/* Avatar placeholder */}
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
              {profile.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{profile.full_name}</h2>
              <span className={`text-sm font-semibold capitalize ${profile.role === 'mentor' ? 'text-primary-600' : 'text-green-600'}`}>
                {profile.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
            <ProfileField label="Qualification" value={profile.qualification ? QUALIFICATION_LABELS[profile.qualification] : null} />
            <ProfileField label="Specialization" value={profile.specialization} />
            <ProfileField label="Occupation" value={profile.occupation ? OCCUPATION_LABELS[profile.occupation] : null} />
            {profile.role === 'mentor' && (
              <ProfileField label="Experience" value={profile.experience ? `${profile.experience} years` : null} />
            )}
            <ProfileField label="Job Title" value={profile.job_title} />
            <ProfileField label="Company" value={profile.company} />
            <ProfileField label="Industry" value={profile.industry} />
            <ProfileField label="State" value={profile.state} />
            <ProfileField label="City" value={profile.city} />
          </div>

          {profile.bio && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-1 text-xs font-semibold uppercase text-gray-400">Bio</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{profile.bio}</p>
            </div>
          )}

          {/* Email shown to owner only */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400">Account email: {user?.email}</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Edit mode ---
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 p-6 text-white shadow-xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Edit Profile</h1>
      </div>

      <ErrorMessage message={error} className="mb-4" />

      <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-lg space-y-5">
        {/* Full Name */}
        <Field label="Full Name" required>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </Field>

        {/* Age */}
        <Field label="Age">
          <input
            type="number"
            min={13}
            max={100}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </Field>

        {/* Gender */}
        <Field label="Gender">
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender | '')}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Prefer not to say</option>
            {Object.entries(GENDER_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>

        {/* Job Title */}
        <Field label="Job Title">
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </Field>

        {/* Company */}
        <Field label="Company / Organization">
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </Field>

        {/* Industry */}
        <Field label="Industry / Domain">
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </Field>

        {/* Annual Income */}
        <Field label="Annual Family Income">
          <select
            value={annualIncome}
            onChange={(e) => setAnnualIncome(e.target.value as AnnualIncome | '')}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select</option>
            {Object.entries(ANNUAL_INCOME_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>

        {/* Category */}
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | '')}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>

        {/* PWD Status */}
        <Field label="PWD Status">
          <select
            value={pwdStatus}
            onChange={(e) => setPwdStatus(e.target.value as PwdStatus | '')}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>

        {/* State */}
        <Field label="State">
          <div className="relative">
            <input
              type="text"
              value={stateSearch}
              onChange={(e) => { setStateSearch(e.target.value); setState(''); setShowStateSuggestions(true); }}
              onFocus={() => setShowStateSuggestions(true)}
              onBlur={() => setTimeout(() => setShowStateSuggestions(false), 150)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Search state..."
              autoComplete="off"
            />
            {showStateSuggestions && filteredStates.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                {filteredStates.map((s) => (
                  <li
                    key={s}
                    onMouseDown={() => { setState(s); setStateSearch(s); setShowStateSuggestions(false); }}
                    className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-primary-50"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>

        {/* City */}
        <Field label="City">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </Field>

        {/* Bio */}
        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={6}
            className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 ${
              isOverBioLimit ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          <p className={`mt-1 text-right text-xs ${isOverBioLimit ? 'text-red-600' : 'text-gray-400'}`}>
            {wordCount} / {BIO_MAX_WORDS} words
          </p>
        </Field>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={cancelEditing}
            disabled={saving}
            className="flex-1 rounded-xl border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || isOverBioLimit}
            className="flex-1 rounded-xl bg-primary-600 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Spinner size="sm" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helpers
function ProfileField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-700">{value}</p>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
