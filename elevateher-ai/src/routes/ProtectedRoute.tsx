import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { LoadingScreen } from '../components/common';
import { ROUTES } from '../constants';

export default function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  // Wait for auth check to complete
  if (authLoading || profileLoading) {
    return <LoadingScreen message="Loading your workspace..." />;
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Redirect to complete-profile if profile is not set up yet
  // (but allow access to /complete-profile itself)
  if (
    profile !== null &&
    !profile.is_profile_complete &&
    location.pathname !== ROUTES.COMPLETE_PROFILE
  ) {
    return <Navigate to={ROUTES.COMPLETE_PROFILE} replace />;
  }

  return <Outlet />;
}
