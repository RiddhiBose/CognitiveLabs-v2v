import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { useProfile } from '../../contexts/ProfileContext';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  mentorOnly?: boolean;
  learnerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: '&#9962;' },
  { label: 'College Finder', path: ROUTES.COLLEGE_FINDER, icon: '&#127979;' },
  { label: 'Scholarships', path: ROUTES.SCHOLARSHIPS, icon: '&#127891;' },
  { label: 'Education Loans', path: ROUTES.EDUCATION_LOANS, icon: '&#128176;' },
  { label: 'Govt. Schemes', path: ROUTES.GOVERNMENT_SCHEMES, icon: '&#127963;' },
  { label: 'Startup Funding', path: ROUTES.STARTUP_FUNDING, icon: '&#128640;' },
  { label: 'Financial Literacy', path: ROUTES.FINANCIAL_LITERACY, icon: '&#128218;' },
  { label: 'Mentorship', path: ROUTES.MENTORSHIP, icon: '&#129309;' },
  { label: 'Mentor Requests', path: '/mentorship/requests', icon: '&#128236;', mentorOnly: true },
  { label: 'Messages', path: ROUTES.CHAT, icon: '&#128172;' },
  { label: 'Saved', path: ROUTES.SAVED, icon: '&#128278;' },
  { label: 'Applications', path: ROUTES.APPLICATIONS, icon: '&#128196;' },
];

export default function Sidebar() {
  const { profile } = useProfile();
  const isMentor = profile?.role === 'mentor';

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.mentorOnly && !isMentor) return false;
    if (item.learnerOnly && isMentor) return false;
    return true;
  });

  return (
    <aside className="hidden w-56 flex-shrink-0 border-r border-gray-200 bg-white md:block">
      <nav className="py-4">
        <ul className="space-y-1 px-2">
          {visibleItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-indigo-50 font-medium text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                  }`
                }
              >
                <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: item.icon }} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Settings at bottom */}
        <div className="mt-4 border-t border-gray-200 px-2 pt-4">
          <NavLink
            to={ROUTES.SETTINGS}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-50 font-medium text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
              }`
            }
          >
            <span aria-hidden="true">&#9881;</span>
            Settings
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}
