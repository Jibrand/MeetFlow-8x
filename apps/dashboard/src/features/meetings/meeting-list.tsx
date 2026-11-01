import * as React from 'react';
import { MeetingItem } from '../../types/meeting';
import { MeetingRow } from './meeting-row';
import { MeetingFilters, MeetingFiltersState } from './meeting-filters';
import { EmptyState } from '@meetflow/ui';
import { VideoOff } from 'lucide-react';

export interface MeetingListProps {
  meetings: MeetingItem[];
}

export function MeetingList({ meetings }: MeetingListProps) {
  const [filters, setFilters] = React.useState<MeetingFiltersState>(() => {
    // Read from search params if available in window
    try {
      const params = new URLSearchParams(window.location.search);
      return {
        search: params.get('q') || '',
        status: (params.get('status') as MeetingFiltersState['status']) || 'all',
        platform: (params.get('platform') as MeetingFiltersState['platform']) || 'all',
        sort: (params.get('sort') as MeetingFiltersState['sort']) || 'newest',
      };
    } catch {
      return { search: '', status: 'all', platform: 'all', sort: 'newest' };
    }
  });

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

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <MeetingFilters
        filters={filters}
        onChange={setFilters}
        totalCount={meetings.length}
        filteredCount={filteredMeetings.length}
      />

      {/* Meeting Rows or Empty State */}
      {filteredMeetings.length > 0 ? (
        <div className="space-y-2">
          {filteredMeetings.map((meeting) => (
            <MeetingRow key={meeting.id} meeting={meeting} />
          ))}
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
            })
          }
        />
      )}
    </div>
  );
}
