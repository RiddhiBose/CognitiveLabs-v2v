import { AuthProvider } from './contexts/AuthContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SavedProvider } from './contexts/SavedContext';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <NotificationProvider>
            <SavedProvider>
              <AppRouter />
            </SavedProvider>
          </NotificationProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
