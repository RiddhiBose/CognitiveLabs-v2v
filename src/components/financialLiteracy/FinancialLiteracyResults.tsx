import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FinancialLiteracyService from '../../services/FinancialLiteracyService';
import type { FinancialLiteracyRecommendation } from '../../types/ai.types';
import SuccessMessage from '../../components/common/SuccessMessage';

interface FinancialLiteracyResultsProps {
  results: FinancialLiteracyRecommendation[];
  searchDurationMs: number;
  totalFound: number;
  cached: boolean;
}

export default function FinancialLiteracyResults({
  results,
  searchDurationMs,
  totalFound,
  cached,
}: FinancialLiteracyResultsProps) {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const topRecommended = results.slice(0, 5);
  const allMatching = results.slice(5);

  const handleSaveCourse = async (course: FinancialLiteracyRecommendation) => {
    if (!user?.id) return;

    setSavingId(course.title);
    try {
      const result = await FinancialLiteracyService.saveCourse(user.id, course);

      if (result.success) {
        setSavedItems((prev) => new Set(prev).add(course.title));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save course:', err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <div className="bg-white rounded-lg shadow-sm p-4 text-sm text-slate-600">
        <p>
          Showing <strong>{totalFound || results.length}</strong> verified financial literacy
          courses matching your search
          {cached && <span className="ml-2 text-amber-600">(cached)</span>}
          {searchDurationMs > 0 && (
            <span className="ml-2 text-slate-500">({(searchDurationMs / 1000).toFixed(1)}s)</span>
          )}
        </p>
      </div>

      {saveSuccess && (
        <SuccessMessage message="Course saved to your collection" />
      )}

      {/* Top Recommended */}
      {topRecommended.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">⭐ Top Recommended</h2>
          <div className="space-y-4">
            {topRecommended.map((course) => (
              <CourseCard
                key={course.title}
                course={course}
                isSaved={savedItems.has(course.title)}
                isSaving={savingId === course.title}
                onSave={() => handleSaveCourse(course)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Matching */}
      {allMatching.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">All Matching Courses</h2>
          <div className="space-y-4">
            {allMatching.map((course) => (
              <CourseCard
                key={course.title}
                course={course}
                isSaved={savedItems.has(course.title)}
                isSaving={savingId === course.title}
                onSave={() => handleSaveCourse(course)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface CourseCardProps {
  course: FinancialLiteracyRecommendation;
  isSaved: boolean;
  isSaving: boolean;
  onSave: () => void;
}

function CourseCard({ course, isSaved, isSaving, onSave }: CourseCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{course.title}</h3>
          {course.provider && (
            <p className="text-sm text-slate-600">Provider: {course.provider}</p>
          )}
        </div>
        <div className="text-right">
          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {course.matchScore}% Match
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {course.level && (
          <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
            {course.level}
          </span>
        )}
        {course.isFree !== undefined && (
          <span
            className={`inline-block px-2 py-1 text-xs rounded ${
              course.isFree
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {course.isFree ? 'Free' : 'Paid'}
          </span>
        )}
        {course.duration && (
          <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
            {course.duration}
          </span>
        )}
      </div>

      {/* Summary */}
      {course.summary && (
        <p className="text-sm text-slate-700 mb-4 leading-relaxed">{course.summary}</p>
      )}

      {/* Reason */}
      {course.reason && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="text-blue-900">
            <strong>Why recommended:</strong> {course.reason}
          </p>
        </div>
      )}

      {/* Details Section (Expandable) */}
      {showDetails && (
        <div className="mb-4 p-4 bg-slate-50 rounded space-y-3 text-sm">
          {course.topic && (
            <div>
              <p className="font-medium text-slate-900">Topic</p>
              <p className="text-slate-700">{course.topic}</p>
            </div>
          )}
          {course.metadata?.syllabus && typeof course.metadata.syllabus === 'string' ? (
            <div>
              <p className="font-medium text-slate-900">Syllabus</p>
              <p className="text-slate-700 whitespace-pre-wrap">{course.metadata.syllabus}</p>
            </div>
          ) : null}
          {course.metadata?.learningOutcomes ? (
            <div>
              <p className="font-medium text-slate-900">Learning Outcomes</p>
              <ul className="list-disc list-inside text-slate-700">
                {Array.isArray(course.metadata.learningOutcomes)
                  ? course.metadata.learningOutcomes.map((outcome: unknown, idx: number) => (
                      <li key={idx}>{String(outcome || '')}</li>
                    ))
                  : typeof course.metadata.learningOutcomes === 'string'
                    ? course.metadata.learningOutcomes
                        .split('\n')
                        .map((outcome: string, idx: number) => (
                          <li key={idx}>{outcome}</li>
                        ))
                    : null}
              </ul>
            </div>
          ) : null}
          {course.metadata?.prerequisites && typeof course.metadata.prerequisites === 'string' ? (
            <div>
              <p className="font-medium text-slate-900">Prerequisites</p>
              <p className="text-slate-700">{course.metadata.prerequisites}</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium transition-colors"
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>

        {(course.applicationLink || course.officialWebsite) && (
          <a
            href={course.applicationLink || course.officialWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
          >
            Enroll / Apply
          </a>
        )}

        <button
          onClick={onSave}
          disabled={isSaving || isSaved}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isSaved
              ? 'bg-green-100 text-green-700 cursor-not-allowed'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isSaving ? '⏳ Saving...' : isSaved ? '✓ Saved' : 'Save Course'}
        </button>
      </div>

      {course.source && (
        <p className="text-xs text-slate-500 mt-3">
          Source: <a href={course.source} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {new URL(course.source).hostname}
          </a>
        </p>
      )}
    </div>
  );
}
