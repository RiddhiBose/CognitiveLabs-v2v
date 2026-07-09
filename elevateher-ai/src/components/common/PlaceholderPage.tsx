interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-800">{title}</h1>
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-base text-gray-500">
          {description ?? 'This module will be implemented in a future development phase.'}
        </p>
      </div>
    </div>
  );
}
