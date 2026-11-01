import * as React from 'react';
import { MeetingItem } from '../../types/meeting';
import { MeetingRow } from './meeting-row';
import { MeetingCard } from './meeting-card';
import { MeetingFilters, MeetingFiltersState } from './meeting-filters';
import { EmptyState } from '@meetflow/ui';
import { VideoOff } from 'lucide-react';
import { groupMeetingsByDate } from '../../lib/meeting-format';
import { Pagination } from '../../components/ui/pagination';

export interface MeetingListProps {
  meetings: MeetingItem[];
}

const PAGE_SIZE = 9;
const LAYOUT_STORAGE_KEY = 'meetflow-meeting-layout-preference';

export function MeetingList({ meetings }: MeetingListProps) {
  const [filters, setFilters] = React.useState<MeetingFiltersState>(() => {
    // Read from search params or localStorage
    try {
      const params = new URLSearchParams(window.location.search);
      const savedLayout = (localStorage.getItem(LAYOUT_STORAGE_KEY) as 'list' | 'grid') || 'grid';
      return {
        search: params.get('q') || '',
        status: (params.get('status') as MeetingFiltersState['status']) || 'all',
        platform: (params.get('platform') as MeetingFiltersState['platform']) || 'all',
        sort: (params.get('sort') as MeetingFiltersState['sort']) || 'newest',
        layout: (params.get('layout') as 'list' | 'grid') || savedLayout,
      };
    } catch {
      return { search: '', status: 'all', platform: 'all', sort: 'newest', layout: 'grid' };
    }
  });

  const [currentPage, setCurrentPage] = React.useState(1);

  // Reset page when filter criteria change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.status, filters.platform, filters.sort]);

  // Persist layout in localStorage
  React.useEffect(() => {
    try {
      if (filters.layout) {
        localStorage.setItem(LAYOUT_STORAGE_KEY, filters.layout);
      }
    } catch {
      // ignore
    }
  }, [filters.layout]);

  // Sync state to URL search parameters for back/forward navigation
  React.useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (filters.search) url.searchParams.set('q', filters.search);
      else url.searchParams.delete('q');

      if (filters.status !== 'all') url.searchParams.set('status', filters.status);
      else url.searchParams.delete('status');

      if (filters.platform !== 'all') url.searchParams.set('platform', filters.platform);
      else url.searchParams.delete('platform');

      if (filters.sort !== 'newest') url.searchParams.set('sort', filters.sort);
      else url.searchParams.delete('sort');

      if (filters.layout && filters.layout !== 'list') url.searchParams.set('layout', filters.layout);
      else url.searchParams.delete('layout');

      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore URL replacement errors in test environments
    }
  }, [filters]);

  // Compute filtered & sorted meetings
  const filteredMeetings = React.useMemo(() => {
    let result = [...meetings];

    // 1. Text Search (title, tags, participant names)
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q)) ||
          m.participants.some((p) => p.name.toLowerCase().includes(q))
      );
    }

    // 2. Status filter
    if (filters.status !== 'all') {
      result = result.filter((m) => m.status === filters.status);
    }

    // 3. Platform filter
    if (filters.platform !== 'all') {
      result = result.filter((m) => m.platform === filters.platform);
    }

    // 4. Sort
    result.sort((a, b) => {
      if (filters.sort === 'newest') {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      }
      if (filters.sort === 'oldest') {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      if (filters.sort === 'longest') {
        return b.durationSeconds - a.durationSeconds;
      }
      return 0;
    });

    return result;
  }, [meetings, filters]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(filteredMeetings.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedMeetings = React.useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredMeetings.slice(start, start + PAGE_SIZE);
  }, [filteredMeetings, safeCurrentPage]);

  // Date grouped buckets for Fathom-like recording organization
  const groupedMeetings = React.useMemo(() => {
    return groupMeetingsByDate(pagedMeetings);
  }, [pagedMeetings]);

  const isGrid = filters.layout === 'grid';

  return (
    <div className="space-y-5">
      {/* Search & Filter Bar */}
      <MeetingFilters
        filters={filters}
        onChange={setFilters}
        totalCount={meetings.length}
        filteredCount={filteredMeetings.length}
      />

      {/* Meeting Rows or Empty State */}
      {filteredMeetings.length > 0 ? (
        <div className="space-y-6">
          {groupedMeetings.map(({ group, meetings: groupItems }) => (
            <section key={group} className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground/60">
                  ({groupItems.length})
                </span>
              </div>

              {isGrid ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groupItems.map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {groupItems.map((meeting) => (
                    <MeetingRow key={meeting.id} meeting={meeting} />
                  ))}
                </div>
              )}
            </section>
          ))}

          {/* Pagination Controls */}
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={filteredMeetings.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        <EmptyState
          icon={<VideoOff className="h-5 w-5" />}
          title="No meetings found"
          description="Try broadening your search or resetting your status/platform filters."
          actionLabel="Clear Filters"
          onAction={() =>
            setFilters({
              search: '',
              status: 'all',
              platform: 'all',
              sort: 'newest',
              layout: filters.layout,
            })
          }
        />
      )}
    </div>
  );
}
