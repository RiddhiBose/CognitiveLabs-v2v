
interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  applicationSteps: string;
  requiredDocuments: string;
  officialWebsite?: string | null;
}

export default function DetailsModal({
  isOpen,
  onClose,
  title,
  applicationSteps,
  requiredDocuments,
  officialWebsite,
}: DetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <span className="text-2xl">📋</span>
              Steps to Apply
            </h3>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                {applicationSteps}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <span className="text-2xl">📄</span>
              Required Documents
            </h3>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                {requiredDocuments}
              </p>
            </div>
          </div>

          {officialWebsite && (
            <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
              <p className="text-sm text-primary-800">
                <strong>Official Website:</strong>{' '}
                <a
                  href={officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:text-indigo-900"
                >
                  {officialWebsite}
                </a>
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
