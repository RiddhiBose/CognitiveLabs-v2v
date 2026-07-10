import { useState } from 'react';
import SearchService from '../../services/search/searchService';
import type { FinancialLiteracyFormValues } from '../../types/financialLiteracy';
import {
  KNOWLEDGE_LEVELS,
  LEARNING_GOALS,
  COURSE_LEVELS,
  COURSE_FORMATS,
  BUDGET_OPTIONS,
  CERTIFICATE_PREFERENCES,
  LANGUAGE_OPTIONS,
  PLATFORM_PREFERENCES,
  FINANCIAL_LITERACY_FORM_DEFAULTS,
} from '../../types/financialLiteracy';

interface FinancialLiteracyFormProps {
  onSearch: (values: FinancialLiteracyFormValues) => void;
  isLoading: boolean;
}

export default function FinancialLiteracyForm({
  onSearch,
  isLoading,
}: FinancialLiteracyFormProps) {
  const [values, setValues] = useState<FinancialLiteracyFormValues>(
    FINANCIAL_LITERACY_FORM_DEFAULTS
  );

  const serviceReady = SearchService.isReady();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(values);
  };

  const handleSelectChange = (field: keyof FinancialLiteracyFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMultiSelectChange = (
    field: keyof FinancialLiteracyFormValues,
    value: string,
    checked: boolean
  ) => {
    setValues((prev) => {
      const current = Array.isArray(prev[field]) ? (prev[field] as string[]) : [];

      if (value === 'Any') {
        // If "Any" is selected, clear others
        return {
          ...prev,
          [field]: checked ? ['Any'] : [],
        };
      } else {
        // Remove "Any" if any specific option is selected
        const filtered = current.filter((item) => item !== 'Any');

        if (checked) {
          return {
            ...prev,
            [field]: [...filtered, value],
          };
        } else {
          return {
            ...prev,
            [field]: filtered.filter((item) => item !== value),
          };
        }
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          Your current profile details are reused automatically for eligibility checks. Use this
          form to define your learning goals.
        </p>
      </div>

      {!serviceReady.ready && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
          <p className="text-sm text-amber-800">Search unavailable. Missing: {serviceReady.missing.join(', ')}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Current Financial Knowledge */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Current Financial Knowledge
          </label>
          <select
            value={values.knowledgeLevel}
            onChange={(e) => handleSelectChange('knowledgeLevel', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {KNOWLEDGE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {/* Learning Goals */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Learning Goals</label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {LEARNING_GOALS.map((goal) => (
              <label key={goal} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(values.learningGoals) && values.learningGoals.includes(goal)}
                  onChange={(e) => handleMultiSelectChange('learningGoals', goal, e.target.checked)}
                  className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">{goal}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Course Level */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Course Level</label>
          <select
            value={values.courseLevel}
            onChange={(e) => handleSelectChange('courseLevel', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {COURSE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {/* Course Format */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Course Format</label>
          <div className="space-y-2">
            {COURSE_FORMATS.map((format) => (
              <label key={format} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(values.courseFormat) && values.courseFormat.includes(format)}
                  onChange={(e) => handleMultiSelectChange('courseFormat', format, e.target.checked)}
                  className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">{format}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Budget</label>
          <select
            value={values.budget}
            onChange={(e) => handleSelectChange('budget', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {BUDGET_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Certificate Preference */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Certificate Preference
          </label>
          <select
            value={values.certificatePreference}
            onChange={(e) => handleSelectChange('certificatePreference', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {CERTIFICATE_PREFERENCES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
          <select
            value={values.language}
            onChange={(e) => handleSelectChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Platform Preference */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Platform Preference
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {PLATFORM_PREFERENCES.map((platform) => (
              <label key={platform} className="flex items-center">
                <input
                  type="checkbox"
                  checked={
                    Array.isArray(values.platformPreference) &&
                    values.platformPreference.includes(platform)
                  }
                  onChange={(e) =>
                    handleMultiSelectChange('platformPreference', platform, e.target.checked)
                  }
                  className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">{platform}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !serviceReady.ready}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isLoading ? 'Searching...' : 'Find Courses'}
        </button>
      </form>
    </div>
  );
}
