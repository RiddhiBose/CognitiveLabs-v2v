import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSaved } from '../../contexts/SavedContext';
import { LoadingScreen, EmptyState } from '../../components/common';
import { ROUTES } from '../../constants';
import { supabase } from '../../services/supabase/client';
import SearchService from '../../services/search/searchService';
import NotificationService from '../../services/notification/notificationService';
import type { SavedItem } from '../../types/saved.types';
import type { SearchHistory } from '../../types/search.types';
import type { Notification } from '../../types';

interface ActivityItem {
  id: string;
  type: 'search' | 'saved' | 'application' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}



export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { user, loading: authLoading } = useAuth();
  const { savedCount, savedVersion } = useSaved();
  const navigate = useNavigate();

  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const displayName = profile?.full_name ?? 'there';
  const userId = user?.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch saved items
        const { data: savedData, error: savedError } = await supabase
          .from('saved_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!savedError) setSavedItems(savedData || []);

        // Fetch search history
        const historyResult = await SearchService.getSearchHistory(userId, 20);
        if (!historyResult.error) setSearchHistory(historyResult.data || []);

        // Fetch notifications
        const notifResult = await NotificationService.getNotifications(userId, 10);
        if (!notifResult.error) setNotifications(notifResult.data || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, savedVersion]);

  if (authLoading || profileLoading || loading) return <LoadingScreen />;

  // Calculate stats
  const searchCount = searchHistory.length;
  const unreadNotifications = notifications.filter(n => !n.is_read).length;

  // Combine recent activity
  const recentActivity: ActivityItem[] = [
    ...searchHistory.map((sh) => ({
      id: `search-${sh.id}`,
      type: 'search' as const,
      title: `Searched for ${sh.query}`,
      description: sh.category ? `${sh.category.charAt(0).toUpperCase() + sh.category.slice(1)} search` : 'Search',
      timestamp: sh.created_at,
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      color: 'from-blue-100 to-blue-50',
    })),
    ...savedItems.map((si) => ({
      id: `saved-${si.id}`,
      type: 'saved' as const,
      title: `Saved ${si.item_type.charAt(0).toUpperCase() + si.item_type.slice(1)}`,
      description: si.item_title,
      timestamp: si.created_at,
      icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
      color: 'from-orange-100 to-orange-50',
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

  // Helper to format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Helper to get the route for a given search category
  const getCategoryRoute = (category: string | null | undefined): string => {
    if (category === 'scholarship') return ROUTES.SCHOLARSHIPS;
    if (category === 'college') return ROUTES.COLLEGE_FINDER;
    if (category === 'loan') return ROUTES.EDUCATION_LOANS;
    if (category === 'financial_literacy' || category === 'financial-literacy') return ROUTES.FINANCIAL_LITERACY;
    if (category === 'startup_funding') return ROUTES.STARTUP_FUNDING;
    return ROUTES.SCHOLARSHIPS;
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-3xl p-8 text-white shadow-2xl">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-2">
            Hello, {displayName}! 👋
          </h1>
          <p className="text-xl opacity-90 mb-6">
            Empowering your journey to success. Explore opportunities tailored just for you.
          </p>
          
          {/* Profile Completion Banner */}
          {profile && !profile.is_profile_complete && (
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold">Complete your profile</p>
                <p className="text-sm opacity-90">Get personalized recommendations by finishing your profile.</p>
              </div>
              <Link
                to={ROUTES.COMPLETE_PROFILE}
                className="bg-white text-primary-700 px-6 py-2 rounded-xl font-semibold hover:bg-primary-50 transition-all"
              >
                Complete Now
              </Link>
            </div>
          )}

          {/* Smart Opportunity Search */}
          <div className="mt-6 relative max-w-lg">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search for opportunities, scholarships, colleges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  // Navigate to appropriate search page based on query - default to scholarships
                  navigate(ROUTES.SCHOLARSHIPS);
                }
              }}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50">
            <svg className="h-6 w-6 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-900">{savedCount}</p>
          <p className="text-gray-500 font-medium">Saved Opportunities</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-green-100 to-green-50">
            <svg className="h-6 w-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-900">{searchCount}</p>
          <p className="text-gray-500 font-medium">Recent Searches</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50">
            <svg className="h-6 w-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-900">{unreadNotifications}</p>
          <p className="text-gray-500 font-medium">Unread Notifications</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                    <svg className="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(item.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              message="No activity yet"
              description="Start exploring opportunities to see your activity here!"
            />
          )}
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Continue Exploring</h2>
          {searchHistory.length > 0 || savedItems.length > 0 ? (
            <div className="space-y-4">
              {searchHistory.slice(0, 3).map((sh) => (
                <div 
                  key={sh.id} 
                  className="p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-all cursor-pointer"
                  onClick={() => navigate(getCategoryRoute(sh.category), { state: { prefill: sh.filters ?? {} } })}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-200 to-orange-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{sh.query}</p>
                      <p className="text-sm text-gray-500">
                        {sh.category ? `${sh.category.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} search` : 'Search'} • {formatDate(sh.created_at)}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
              
              {savedItems.slice(0, 3 - searchHistory.slice(0, 3).length).map((si) => (
                <div 
                  key={si.id} 
                  className="p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-all cursor-pointer"
                  onClick={() => navigate(ROUTES.SAVED)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-200 to-orange-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{si.item_title}</p>
                      <p className="text-sm text-gray-500">
                        Saved {si.item_type.charAt(0).toUpperCase() + si.item_type.slice(1)} • {formatDate(si.created_at)}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              message="Nothing to continue exploring"
              description="Start searching and saving opportunities to see them here!"
            />
          )}
        </div>
      </div>
    </div>
  );
}
