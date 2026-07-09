import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isValidEmail } from '../../utils/validation';
import { ErrorMessage, SuccessMessage } from '../../components/common';
import { ROUTES } from '../../constants';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setEmailError(null);

    if (!email.trim()) {
      setEmailError('Email is required.');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    const result = await forgotPassword({ email });
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Password reset email sent. Please check your inbox.');
    }
  };

  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Reset Password</h1>
      <p className="mb-6 text-sm text-gray-500">
        Enter your email address and we will send you a reset link.
      </p>

      <ErrorMessage message={error} className="mb-4" />
      <SuccessMessage message={success} className="mb-4" />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${
              emailError ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="you@example.com"
            disabled={loading}
          />
          {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || !!success}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        <Link to={ROUTES.LOGIN} className="font-medium text-indigo-600 hover:underline">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
