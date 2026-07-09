import { AuthProvider } from './contexts/AuthContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <NotificationProvider>
            <AppRouter />
          </NotificationProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
