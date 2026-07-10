import React, { useState } from 'react';
import type { CollegeRecommendation } from '../../types';

interface CollegeResultCardProps {
  college: CollegeRecommendation;
  isSaved: boolean;
  onSaveToggle: () => void;
  saving: boolean;
}

export const CollegeResultCard: React.FC<CollegeResultCardProps> = ({
  college,
  isSaved,
  onSaveToggle,
  saving,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Extract info safely
  const name = college.title;
  const location = college.location || 'Location Not Specified';
  const course = college.courseName || (college.metadata?.courseName as string) || 'Course Not Specified';
  const score = college.matchScore || 0;
  const reason = college.reason;
  const eligibility = college.summary;
  const fee = college.fees || (college.metadata?.fees as string) || 'N/A';
  const acceptedExams = college.entranceExam || (college.metadata?.entranceExam as string) || 'N/A';
  const officialWebsite = college.officialWebsite;
  const admissionPortal = college.applicationLink;
  const source = college.source;
  const cutoff = college.cutoff || (college.metadata?.cutoff as string) || 'Not available';
  const collegeType = college.collegeType || (college.metadata?.collegeType as string) || 'Not specified';
  const hostelAvailable = college.hostelAvailable ?? (college.metadata?.hostelAvailable as boolean);
  const girlsOnly = college.girlsOnly ?? (college.metadata?.girlsOnly as boolean);
  const locationType = college.locationType || (college.metadata?.locationType as string) || 'Not specified';


  // Determine score color
  const getScoreColorClass = (val: number) => {
    if (val >= 90) return 'text-green-600 border-green-200 bg-green-50';
    if (val >= 75) return 'text-indigo-600 border-indigo-200 bg-indigo-50';
    if (val >= 50) return 'text-yellow-600 border-yellow-200 bg-yellow-50';
    return 'text-red-600 border-red-200 bg-red-50';
  };

  const getScoreProgressColor = (val: number) => {
    if (val >= 90) return 'bg-green-500';
    if (val >= 75) return 'bg-indigo-500';
    if (val >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md flex flex-col h-full">
      {/* Top Banner (subtle gradient/color side line) */}
      <div className={`h-1.5 w-full ${getScoreProgressColor(score)}`} />

      {/* Main Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Row: Course & Match Score */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              {course}
            </span>
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${getScoreColorClass(
                score,
              )}`}
            >
              🎯 {score}% Match
            </div>
          </div>

          {/* College Name */}
          <h3 className="text-lg font-bold text-gray-800 leading-snug mb-1 hover:text-indigo-600 transition-colors">
            {name}
          </h3>

          {/* Location Badge */}
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3.5">
            <span className="text-base">📍</span>
            <span>{location}</span>
          </div>

          {/* Key Quick Specs grid */}
          <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-lg p-3 text-xs mb-4">
            <div>
              <span className="block text-gray-400 font-medium">Est. Tuition Fee</span>
              <span className="text-gray-700 font-semibold">{fee}</span>
            </div>
            <div>
              <span className="block text-gray-400 font-medium">Accepted Exams</span>
              <span className="text-gray-700 font-semibold truncate block" title={acceptedExams}>
                {acceptedExams}
              </span>
            </div>
            <div>
              <span className="block text-gray-400 font-medium">Cutoff</span>
              <span className="text-gray-700 font-semibold">{cutoff}</span>
            </div>
            <div>
              <span className="block text-gray-400 font-medium">College Type</span>
              <span className="text-gray-700 font-semibold">{collegeType}</span>
            </div>
          </div>

          {/* Core Reason why recommended */}
          <p className="text-xs text-gray-600 italic bg-indigo-50/10 rounded-md border-l-2 border-indigo-400 p-2.5 mb-3 line-clamp-3">
            <strong>Why Recommended:</strong> {reason}
          </p>
        </div>

        <div>
          {/* Actions & Details Toggle */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-0.5 py-1.5 cursor-pointer"
            >
              {showDetails ? 'Hide Details ▲' : 'Show Details ▼'}
            </button>

            <button
              onClick={onSaveToggle}
              disabled={saving}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                isSaved
                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>{isSaved ? '❤️ Saved' : '🤍 Save College'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Details Drawer */}
      {showDetails && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-5 text-xs space-y-4 animate-fadeIn">
          {/* Eligibility summary */}
          <div>
            <h4 className="font-bold text-gray-700 uppercase tracking-wide mb-1">
              Eligibility & Details
            </h4>
            <p className="text-gray-600 leading-relaxed">{eligibility}</p>
          </div>

          {/* Additional details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold text-gray-700 mb-1">Hostel Available</h5>
              <span className="text-gray-600">{hostelAvailable === true ? 'Yes' : hostelAvailable === false ? 'No' : 'Not specified'}</span>
            </div>
            <div>
              <h5 className="font-semibold text-gray-700 mb-1">Girls Only</h5>
              <span className="text-gray-600">{girlsOnly === true ? 'Yes' : girlsOnly === false ? 'No' : 'Not specified'}</span>
            </div>
            <div>
              <h5 className="font-semibold text-gray-700 mb-1">Location Type</h5>
              <span className="text-gray-600">{locationType}</span>
            </div>
            <div>
              <h5 className="font-semibold text-gray-700 mb-1">Ranking</h5>
              <span className="text-gray-600">{college.ranking || 'Not available'}</span>
            </div>
          </div>

          {/* Links Section */}
          <div className="space-y-2 pt-2">
            <div className="flex flex-wrap gap-2">
              {officialWebsite && (
                <a
                  href={officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2.5 py-1.5 font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  🌐 Visit Website
                </a>
              )}
              {admissionPortal && (
                <a
                  href={admissionPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded bg-green-600 px-2.5 py-1.5 font-semibold text-white hover:bg-green-700 transition-colors"
                >
                  📝 Open Admission Portal
                </a>
              )}
            </div>

            {source && (
              <div className="text-[10px] text-gray-400 mt-1">
                Source:{' '}
                <a
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-indigo-500"
                >
                  {source}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeResultCard;
