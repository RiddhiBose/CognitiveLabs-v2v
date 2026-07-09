import { Outlet } from 'react-router-dom';
import { APP_NAME } from '../../constants';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white py-3 text-center">
        <span className="text-lg font-bold text-indigo-600">{APP_NAME}</span>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <Outlet />
      </main>
      <footer className="py-3 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  );
}
