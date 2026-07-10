import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSaved } from '../../contexts/SavedContext';
import SavedItemsService from '../../services/SavedItemsService';
import { CollegeResultCard } from '../../components/college';
import { ScholarshipResultCard } from '../../components/scholarship';
import LoanCard from '../../components/educationLoan/LoanCard';
import { StartupFundingResultCard } from '../../components/startupFunding';
import { LoadingScreen } from '../../components/common';
import type { SavedItem } from '../../types/saved.types';
import { canonicalType } from '../../types/saved.types';
import type { CollegeRecommendation } from '../../types';
import type { ScholarshipRecommendation, StartupFundingRecommendation, FinancialLiteracyRecommendation } from '../../types/ai.types';
import type { EducationLoanRecommendation } from '../../types/educationLoan';

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTER_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'college', label: '🏛️ Colleges' },
  { key: 'scholarship', label: '🎓 Scholarships' },
  { key: 'loan', label: '💰 Education Loans' },
  { key: 'startup_funding', label: '🚀 Startup Funding' },
  { key: 'financial_literacy', label: '📚 Financial Literacy' },
  { key: 'mentor', label: '🤝 Mentors' },
];

type SortKey = 'recent' | 'oldest' | 'score' | 'alpha';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recently Saved' },
  { key: 'oldest', label: 'Oldest Saved' },
  { key: 'score', label: 'Highest Match Score' },
  { key: 'alpha', label: 'Alphabetical' },
];

// ─── Safe snapshot extractor ──────────────────────────────────────────────────

function snap<T>(item: SavedItem): T {
  return (item.recommendation_snapshot ?? item.item_metadata ?? {}) as T;
}

// ─── Financial Literacy saved card ───────────────────────────────────────────
// Re-implements the minimal visual for a saved FL course since FinancialLiteracyResults
// is a standalone component and cannot be reused card-by-card without refactoring it.

function FinancialLiteracyCourseCard({
  item,
  onRemove,
  removing,
}: {
  item: SavedItem;
  onRemove: () => void;
  removing: boolean;
}) {
  const course = snap<FinancialLiteracyRecommendation>(item);
  const enrollHref = (course.applicationLink as string) || (course.officialWebsite as string) || null;
  const nism = ((course.provider as string) ?? '').toLowerCase().includes('nism') ||
    ((course.source as string) ?? '').toLowerCase().includes('nism.ac.in');

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900 mb-1">{item.item_title}</h3>
          {(course.provider as string) && (
            <p className="text-sm text-gray-500">Provider: {course.provider as string}</p>
          )}
        </div>
        {typeof (course.matchScore as number) === 'number' && (
          <span className="ml-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
            {course.matchScore as number}% Match
          </span>
        )}
      </div>
      {nism && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700">
          🏛 Official NISM Course
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-3">
        {(course.level as string) && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{course.level as string}</span>}
        {(course.isFree as boolean) !== undefined && (
          <span className={`rounded px-2 py-0.5 text-xs ${(course.isFree as boolean) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {(course.isFree as boolean) ? 'Free' : 'Paid'}
          </span>
        )}
        {(course.duration as string) && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{course.duration as string}</span>}
      </div>
      {(course.summary as string) && (
        <p className="mb-3 text-sm text-gray-600 leading-relaxed line-clamp-3">{course.summary as string}</p>
      )}
      {(course.reason as string) && (
        <div className="mb-3 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
          <strong>Why recommended:</strong> {course.reason as string}
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        {enrollHref && (
          <a href={enrollHref} target="_blank" rel="noopener noreferrer"
            className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition-colors ${nism ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            {nism ? '🏛 Enroll on NISM' : 'Enroll / Apply'}
          </a>
        )}
        <button onClick={onRemove} disabled={removing}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors cursor-pointer"
        >
          {removing ? 'Removing…' : '🗑 Remove'}
        </button>
      </div>
    </div>
  );
}

// ─── Mentor saved card ────────────────────────────────────────────────────────

function MentorSavedCard({
  item,
  onRemove,
  removing,
}: {
  item: SavedItem;
  onRemove: () => void;
  removing: boolean;
}) {
  const m = snap<Record<string, unknown>>(item);
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white">
          {item.item_title.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')}
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">{item.item_title}</h3>
          {(m.job_title as string) && <p className="text-xs text-primary-600 font-medium">{m.job_title as string}</p>}
          {(m.occupation as string) && <p className="text-xs text-gray-500">{m.occupation as string}</p>}
        </div>
        {typeof (m.compatibilityScore as number) === 'number' && (
          <span className="ml-auto rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-700">
            ✦ {m.compatibilityScore as number}% Match
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(m.qualification as string) && <span className="rounded-xl bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">🎓 {m.qualification as string}</span>}
        {(m.specialization as string) && <span className="rounded-xl bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">{m.specialization as string}</span>}
        {(m.experience as number) != null && <span className="rounded-xl bg-gray-50 px-2 py-0.5 text-xs text-gray-500">⏱ {m.experience as number}yr exp</span>}
      </div>
      {(m.bio as string) && <p className="mb-3 text-xs text-gray-500 line-clamp-2">{m.bio as string}</p>}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <a href={`/mentorship/mentor/${item.item_id}`}
          className="flex-1 rounded-xl border border-primary-200 bg-white px-3 py-2 text-xs font-bold text-primary-700 hover:bg-primary-50 text-center transition-colors"
        >
          View Profile
        </a>
        <button onClick={onRemove} disabled={removing}
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors cursor-pointer"
        >
          {removing ? '…' : '🗑 Remove'}
        </button>
      </div>
    </div>
  );
}

// ─── Generic fallback card ────────────────────────────────────────────────────

function GenericSavedCard({
  item,
  onRemove,
  removing,
}: {
  item: SavedItem;
  onRemove: () => void;
  removing: boolean;
}) {
  const meta = snap<Record<string, unknown>>(item);
  const website = (meta.officialWebsite as string) || (meta.official_website as string) || null;
  const appLink = (meta.applicationLink as string) || (meta.application_link as string) || null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-gray-900 text-sm">{item.item_title}</h3>
        {typeof (meta.matchScore as number) === 'number' && (
          <span className="shrink-0 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-700">
            {meta.matchScore as number}% Match
          </span>
        )}
      </div>
      {(meta.summary as string) && (
        <p className="mb-3 text-xs text-gray-500 line-clamp-3">{meta.summary as string}</p>
      )}
      {(meta.reason as string) && (
        <div className="mb-3 rounded-xl bg-primary-50 p-3 text-xs text-primary-900">
          <strong>Why recommended:</strong> {meta.reason as string}
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer"
            className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 transition-colors"
          >
            🌐 Official Website
          </a>
        )}
        {appLink && appLink !== website && (
          <a href={appLink} target="_blank" rel="noopener noreferrer"
            className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 transition-colors"
          >
            Apply Now
          </a>
        )}
        <button onClick={onRemove} disabled={removing}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors cursor-pointer"
        >
          {removing ? 'Removing…' : '🗑 Remove'}
        </button>
      </div>
    </div>
  );
}

// ─── Main render helper: pick the right card per type ────────────────────────

function SavedCard({
  item,
  onRemove,
  removing,
}: {
  item: SavedItem;
  onRemove: () => void;
  removing: boolean;
}) {
  const ct = canonicalType(item.item_type);

  if (ct === 'college') {
    const college = snap<CollegeRecommendation>(item);
    return (
      <CollegeResultCard
        college={college}
        isSaved={true}
        onSaveToggle={onRemove}
        saving={removing}
      />
    );
  }

  if (ct === 'scholarship') {
    const scholarship = snap<ScholarshipRecommendation>(item);
    return (
      <ScholarshipResultCard
        scholarship={scholarship}
        onSave={onRemove}
        saving={removing}
        saved={false}
      />
    );
  }

  if (ct === 'loan') {
    const loan = snap<EducationLoanRecommendation>(item);
    return (
      <LoanCard
        loan={loan}
        isSaved={true}
        onSave={() => {}}
        onUnsave={onRemove}
        saveLoading={removing}
      />
    );
  }

  if (ct === 'startup_funding') {
    const opp = snap<StartupFundingRecommendation>(item);
    return (
      <StartupFundingResultCard
        opportunity={opp}
        onSave={onRemove}
        saving={removing}
        saved={false}
        onViewDetails={() => {}}
      />
    );
  }

  if (ct === 'financial_literacy') {
    return (
      <FinancialLiteracyCourseCard item={item} onRemove={onRemove} removing={removing} />
    );
  }

  if (ct === 'mentor') {
    return <MentorSavedCard item={item} onRemove={onRemove} removing={removing} />;
  }

  return <GenericSavedCard item={item} onRemove={onRemove} removing={removing} />;
}

// ─── Count helpers ─────────────────────────────────────────────────────────────

function countsByType(items: SavedItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const ct = canonicalType(item.item_type);
    counts[ct] = (counts[ct] ?? 0) + 1;
  }
  return counts;
}

// ─── SavedPage ────────────────────────────────────────────────────────────────

export default function SavedPage() {
  const { user } = useAuth();
  const { adjustCount, savedVersion } = useSaved();
  const location = useLocation();

  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');

  // ─── Load all saved items ──────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    const res = await SavedItemsService.getAll(user.id);
    if (res.error) setError(res.error);
    else setItems(res.data ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load, location.key, savedVersion]);

  // ─── Remove ────────────────────────────────────────────────────────────────

  const handleRemove = useCallback(async (item: SavedItem) => {
    if (!user?.id) return;
    setRemovingId(item.id);

    // Optimistic remove
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    adjustCount(-1);

    const res = await SavedItemsService.unsave(user.id, item.item_type, item.item_id);
    if (res.error) {
      // Roll back
      setItems((prev) => [item, ...prev].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      adjustCount(1);
      setError(res.error);
    }
    setRemovingId(null);
  }, [user?.id, adjustCount]);

  // ─── Derived filtered + sorted list ──────────────────────────────────────

  const filtered = useMemo(() => {
    let result = items;

    // Filter by type
    if (activeFilter !== 'all') {
      result = result.filter((i) => canonicalType(i.item_type) === activeFilter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => {
        const snap = { ...i.recommendation_snapshot, ...i.item_metadata } as Record<string, unknown>;
        return (
          i.item_title.toLowerCase().includes(q) ||
          ((snap.provider as string) ?? '').toLowerCase().includes(q) ||
          ((snap.organization as string) ?? '').toLowerCase().includes(q) ||
          ((snap.bankName as string) ?? '').toLowerCase().includes(q) ||
          ((snap.location as string) ?? '').toLowerCase().includes(q)
        );
      });
    }

    // Sort
    return [...result].sort((a, b) => {
      if (sort === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === 'score') {
        const sa = (snap<Record<string, unknown>>(a).matchScore as number) ?? 0;
        const sb = (snap<Record<string, unknown>>(b).matchScore as number) ?? 0;
        return sb - sa;
      }
      if (sort === 'alpha') return a.item_title.localeCompare(b.item_title);
      return 0;
    });
  }, [items, activeFilter, search, sort]);

  const counts = useMemo(() => countsByType(items), [items]);

  const tabCount = (key: string) => {
    if (key === 'all') return items.length;
    return counts[key] ?? 0;
  };

  if (loading) return <LoadingScreen />;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center pr-10 text-9xl">🔖</div>
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Saved Opportunities</h1>
          <p className="mt-2 text-sm text-primary-100">
            {items.length} recommendation{items.length !== 1 ? 's' : ''} saved across all modules
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, provider, bank…"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-50 transition-all"
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-primary-500 focus:outline-none transition-all"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const count = tabCount(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                activeFilter === tab.key
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-200'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-200 hover:bg-primary-50'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline cursor-pointer text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-14 text-center shadow-lg">
          <p className="text-5xl mb-3">🔖</p>
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            {items.length === 0
              ? 'No saved recommendations yet'
              : 'No results for this filter or search'}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {items.length === 0
              ? 'Use the ♡ Save button on any recommendation card to save it here.'
              : 'Try a different filter or clear the search.'}
          </p>
          {(activeFilter !== 'all' || search) && (
            <button
              onClick={() => { setActiveFilter('all'); setSearch(''); }}
              className="mt-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-primary-200 transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Result count label */}
      {!loading && filtered.length > 0 && (
        <p className="mb-4 text-sm text-gray-500">
          Showing <span className="font-bold text-gray-800">{filtered.length}</span> of {' '}
          <span className="font-bold text-gray-800">{items.length}</span> saved items
        </p>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <SavedCard
              key={item.id}
              item={item}
              onRemove={() => handleRemove(item)}
              removing={removingId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
