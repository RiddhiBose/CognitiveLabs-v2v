import { EmptyState } from '../../components/common';
export default function SavedPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-800">Saved Opportunities</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <EmptyState
          message="No saved opportunities yet."
          description="This module will be implemented in a future development phase."
        />
      </div>
    </div>
  );
}
