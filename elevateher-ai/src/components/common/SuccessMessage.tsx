interface SuccessMessageProps {
  message: string | null;
  className?: string;
}

export default function SuccessMessage({ message, className = '' }: SuccessMessageProps) {
  if (!message) return null;
  return (
    <div
      role="status"
      className={`rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 ${className}`}
    >
      {message}
    </div>
  );
}
