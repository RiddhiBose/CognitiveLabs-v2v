interface EmptyStateProps {
  message: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ message, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 text-4xl text-gray-300">&#9711;</div>
      <p className="text-base font-medium text-gray-600">{message}</p>
      {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
