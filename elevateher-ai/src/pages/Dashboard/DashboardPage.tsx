import { Link } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import { LoadingScreen } from '../../components/common';
import { ROUTES } from '../../constants';

interface NavCard {
  title: string;
  description: string;
  path: string;
  icon: string;
}

const NAV_CARDS: NavCard[] = [
  { title: 'College Finder', description: 'Discover colleges that match your goals.', path: ROUTES.COLLEGE_FINDER, icon: '🏛️' },
  { title: 'Scholarships', description: 'Find scholarships you are eligible for.', path: ROUTES.SCHOLARSHIPS, icon: '🎓' },
  { title: 'Education Loans', description: 'Explore loan options for your education.', path: ROUTES.EDUCATION_LOANS, icon: '💰' },
  { title: 'Government Schemes', description: 'Browse schemes designed for you.', path: ROUTES.GOVERNMENT_SCHEMES, icon: '🏛' },
  { title: 'Startup Funding', description: 'Find funding for your startup idea.', path: ROUTES.STARTUP_FUNDING, icon: '🚀' },
  { title: 'Financial Literacy', description: 'Learn to manage and grow your money.', path: ROUTES.FINANCIAL_LITERACY, icon: '📚' },
  { title: 'Internship Finder', description: 'Find internships that boost your career.', path: ROUTES.INTERNSHIPS, icon: '💼' },
  { title: 'Mentorship', description: 'Connect with mentors in your field.', path: ROUTES.MENTORSHIP, icon: '🤝' },
  { title: 'Saved Opportunities', description: 'View your saved items.', path: ROUTES.SAVED, icon: '🔖' },
  { title: 'Applications', description: 'Track your applications.', path: ROUTES.APPLICATIONS, icon: '📄' },
  { title: 'Notifications', description: 'Stay up to date.', path: ROUTES.NOTIFICATIONS, icon: '🔔' },
];

export default function DashboardPage() {
  const { profile, loading } = useProfile();

  if (loading) return <LoadingScreen />;

  const displayName = profile?.full_name ?? 'there';
  const role = profile?.role ?? 'learner';

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Hello, <span className="text-indigo-600">{displayName}</span> 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Role:{' '}
          <span className={`font-medium capitalize ${role === 'mentor' ? 'text-indigo-600' : 'text-green-600'}`}>
            {role}
          </span>
        </p>
      </div>

      {/* Profile incomplete warning */}
      {profile && !profile.is_profile_complete && (
        <div className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Your profile is incomplete.{' '}
          <Link to={ROUTES.COMPLETE_PROFILE} className="font-medium underline">
            Complete it now
          </Link>{' '}
          to get personalized recommendations.
        </div>
      )}

      {/* Navigation cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NAV_CARDS.map((card) => (
          <Link
            key={card.path}
            to={card.path}
            className="rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className="mb-2 text-2xl">{card.icon}</div>
            <h2 className="font-semibold text-gray-800">{card.title}</h2>
            <p className="mt-1 text-xs text-gray-500">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
