import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isValidEmail } from '../../utils/validation';
import { ErrorMessage } from '../../components/common';
import { ROUTES } from '../../constants';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.DASHBOARD;

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = 'Email is required.';
    else if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Password is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoading(true);
    const result = await signIn({ email, password });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Sign In</h1>
      <p className="mb-6 text-sm text-gray-500">Welcome back to ElevateHer AI.</p>

      <ErrorMessage message={error} className="mb-4" />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email */}
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
              fieldErrors.email ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="you@example.com"
            disabled={loading}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${
              fieldErrors.password ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="••••••••"
            disabled={loading}
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-indigo-600 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
