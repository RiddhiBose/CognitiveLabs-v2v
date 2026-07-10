import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { PublicLayout } from '../components/layout';
import { ProtectedLayout } from '../components/layout';
import { ROUTES } from '../constants';

// Auth pages
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/RegisterPage';
import ForgotPasswordPage from '../pages/Login/ForgotPasswordPage';
import CompleteProfilePage from '../pages/Register/CompleteProfilePage';

// App pages
import DashboardPage from '../pages/Dashboard/DashboardPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import SettingsPage from '../pages/Settings/SettingsPage';

// Placeholder pages
import CollegeFinderPage from '../pages/CollegeFinder/CollegeFinderPage';
import ScholarshipsPage from '../pages/Scholarships/ScholarshipsPage';
import EducationLoansPage from '../pages/EducationLoans/EducationLoansPage';
import StartupFundingPage from '../pages/StartupFunding/StartupFundingPage';
import FinancialLiteracyPage from '../pages/FinancialLiteracy/FinancialLiteracyPage';
import MentorshipPage from '../pages/Mentorship/MentorshipPage';
import MentorProfilePage from '../pages/Mentorship/MentorProfilePage';
import MentorRequestsPage from '../pages/Mentorship/MentorRequestsPage';
import ChatPage from '../pages/Chat/ChatPage';
import SavedPage from '../pages/Saved/SavedPage';
import NotificationsPage from '../pages/Notifications/NotificationsPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Protected routes — require authentication */}
        <Route element={<ProtectedRoute />}>
          {/* Complete profile (no sidebar/navbar needed) */}
          <Route path={ROUTES.COMPLETE_PROFILE} element={<CompleteProfilePage />} />

          {/* Full app layout */}
          <Route element={<ProtectedLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            <Route path={ROUTES.COLLEGE_FINDER} element={<CollegeFinderPage />} />
            <Route path={ROUTES.SCHOLARSHIPS} element={<ScholarshipsPage />} />
            <Route path={ROUTES.EDUCATION_LOANS} element={<EducationLoansPage />} />
            <Route path={ROUTES.STARTUP_FUNDING} element={<StartupFundingPage />} />
            <Route path={ROUTES.FINANCIAL_LITERACY} element={<FinancialLiteracyPage />} />
            <Route path={ROUTES.MENTORSHIP} element={<MentorshipPage />} />
            <Route path="/mentorship/mentor/:mentorId" element={<MentorProfilePage />} />
            <Route path="/mentorship/requests" element={<MentorRequestsPage />} />
            <Route path={ROUTES.CHAT} element={<ChatPage />} />
            <Route path="/chat/:connectionId" element={<ChatPage />} />
            <Route path={ROUTES.SAVED} element={<SavedPage />} />
            <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
