import { Outlet } from 'react-router-dom';
import { TEAM_NAME, APP_NAME, APP_TAGLINE } from '../../constants';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen bg-warm-white">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white p-12">
        <div>
          <p className="text-sm font-semibold tracking-[0.2em] uppercase opacity-80">{TEAM_NAME}</p>
          <h1 className="mt-2 text-5xl font-bold">{APP_NAME}</h1>
          <p className="mt-4 text-lg opacity-90">{APP_TAGLINE}</p>
        </div>
        <div className="text-sm opacity-75">
          &copy; {new Date().getFullYear()} {TEAM_NAME}. All rights reserved.
        </div>
      </div>

      {/* Right side - Content */}
      <div className="flex-1 flex flex-col">
        <header className="lg:hidden flex items-center justify-center py-6 border-b border-gray-100">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary-600">{TEAM_NAME}</p>
            <h2 className="mt-1 text-2xl font-bold text-charcoal">{APP_NAME}</h2>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <Outlet />
        </main>

        <footer className="lg:hidden py-4 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} {TEAM_NAME}
        </footer>
      </div>
    </div>
  );
}
