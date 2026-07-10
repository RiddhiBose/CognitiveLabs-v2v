// LoanLoadingState — animated step-by-step loading indicator
// Cycles through LOAN_LOADING_STEPS with a progress bar.

import { useEffect, useState } from 'react';
import { LOAN_LOADING_STEPS } from '../../types/educationLoan';

const STEP_DURATION_MS = 2200;

export default function LoanLoadingState() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setStepIndex(0);
    setProgress(0);

    const total = LOAN_LOADING_STEPS.length;

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        const next = prev + 1;
        if (next >= total) {
          clearInterval(interval);
          return prev;
        }
        return next;
      });
      setProgress((prev) => {
        const next = prev + Math.round(100 / total);
        return Math.min(next, 95); // never reach 100 until results are ready
      });
    }, STEP_DURATION_MS);

    return () => clearInterval(interval);
  }, []);

  const currentStep = LOAN_LOADING_STEPS[stepIndex] ?? LOAN_LOADING_STEPS[LOAN_LOADING_STEPS.length - 1];

  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 px-6 py-12 text-center"
      role="status"
      aria-live="polite"
      aria-label="Searching for education loans"
    >
      {/* Pulsing icon */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
        <span className="animate-pulse text-3xl" aria-hidden="true">
          🏦
        </span>
      </div>

      {/* Step message */}
      <p className="mb-1 text-base font-semibold text-indigo-700">{currentStep}</p>
      <p className="mb-6 text-xs text-indigo-500">
        This may take 20–30 seconds while we check official sources
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="mb-1 flex justify-between text-xs text-indigo-400">
          <span>Searching…</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
      </div>

      {/* Step dots */}
      <div className="mt-6 flex gap-2">
        {LOAN_LOADING_STEPS.map((_, i) => (
          <span
            key={i}
            className={`inline-block h-2 w-2 rounded-full transition-colors duration-300 ${
              i <= stepIndex ? 'bg-indigo-600' : 'bg-indigo-200'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* AI badge */}
      <p className="mt-6 flex items-center gap-1.5 text-xs text-gray-400">
        <span aria-hidden="true">✨</span>
        Powered by Gemini AI + Live Bank Data
      </p>
    </div>
  );
}
