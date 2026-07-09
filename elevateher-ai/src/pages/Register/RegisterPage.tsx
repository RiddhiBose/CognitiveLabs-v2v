import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isValidEmail, isValidPassword, getPasswordStrength } from '../../utils/validation';
import { ErrorMessage } from '../../components/common';
import { ROUTES } from '../../constants';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const passwordStrength = password ? getPasswordStrength(password) : null;

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = 'Email is required.';
    else if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Password is required.';
    else if (!isValidPassword(password)) errors.password = 'Password must be at least 8 characters and contain a letter and a number.';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    const result = await signUp({ email, password, confirmPassword });
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      // Redirect to complete profile after signup
      navigate(ROUTES.COMPLETE_PROFILE, { replace: true });
    }
  };

  const strengthColor = {
    weak: 'bg-red-400',
    medium: 'bg-yellow-400',
    strong: 'bg-green-500',
  };

  return (
    <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Create Account</h1>
      <p className="mb-6 text-sm text-gray-500">Join ElevateHer AI to get started.</p>

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
          {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${
              fieldErrors.password ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="Min. 8 characters"
            disabled={loading}
          />
          {/* Strength indicator */}
          {passwordStrength && (
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all ${strengthColor[passwordStrength.strength]}`}
                  style={{
                    width:
                      passwordStrength.strength === 'weak'
                        ? '33%'
                        : passwordStrength.strength === 'medium'
                          ? '66%'
                          : '100%',
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">{passwordStrength.message}</span>
            </div>
          )}
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 ${
              fieldErrors.confirmPassword ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="Re-enter your password"
            disabled={loading}
          />
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
