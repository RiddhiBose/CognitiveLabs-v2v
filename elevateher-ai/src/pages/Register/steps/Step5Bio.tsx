import { useState, type FormEvent } from 'react';
import type { ProfileStep5 } from '../../../types';
import { countWords, BIO_MAX_WORDS } from '../../../utils';

interface Props {
  onComplete: (data: ProfileStep5) => void;
  onBack: () => void;
  submitting: boolean;
}

export default function Step5Bio({ onComplete, onBack, submitting }: Props) {
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wordCount = countWords(bio);
  const isOverLimit = wordCount > BIO_MAX_WORDS;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!bio.trim()) {
      setError('Please write a short bio about yourself.');
      return;
    }
    if (isOverLimit) {
      setError(`Bio must be within ${BIO_MAX_WORDS} words. You have ${wordCount} words.`);
      return;
    }
    onComplete({ bio: bio.trim() });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">About You</h3>
        <p className="text-sm text-gray-500">
          Tell us about yourself. This will appear on your public profile.
        </p>
      </div>

      <div className="rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-600">
        <p className="font-medium">What to include:</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-gray-500">
          <li>Your interests and passions</li>
          <li>Career goals</li>
          <li>Skills and achievements</li>
          <li>Areas where you would like guidance</li>
          <li>What mentors or learners should know about you</li>
        </ul>
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium text-gray-700">
          Short Bio <span className="text-red-500">*</span>
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={8}
          className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${
            isOverLimit ? 'border-red-400' : 'border-gray-300'
          }`}
          placeholder="Write about yourself..."
          disabled={submitting}
        />
        <div className="mt-1 flex justify-between">
          <span />
          <span className={`text-xs ${isOverLimit ? 'text-red-600' : 'text-gray-400'}`}>
            {wordCount} / {BIO_MAX_WORDS} words
          </span>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          &larr; Back
        </button>
        <button
          type="submit"
          disabled={submitting || isOverLimit}
          className="flex-1 rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Saving profile...' : 'Complete Profile'}
        </button>
      </div>
    </form>
  );
}
