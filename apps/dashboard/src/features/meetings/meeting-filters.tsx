import {
  Search,
  X,
  SlidersHorizontal,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import { Input, Button, Badge } from '@meetflow/ui';
import { MeetingStatus, MeetingPlatform } from '../../types/meeting';

export interface MeetingFiltersState {
  search: string;
  status: 'all' | MeetingStatus;
  platform: 'all' | MeetingPlatform;
  sort: 'newest' | 'oldest' | 'longest';
  layout?: 'list' | 'grid';
}

export interface MeetingFiltersProps {
  filters: MeetingFiltersState;
  onChange: (filters: MeetingFiltersState) => void;
  totalCount: number;
  filteredCount: number;
  loading?: boolean;
}

export function MeetingFilters({
  filters,
  onChange,
  totalCount,
  filteredCount,
  loading,
}: MeetingFiltersProps) {
  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.platform !== 'all' ||
    filters.sort !== 'newest';

  const resetFilters = () => {
    onChange({
      search: '',
      status: 'all',
      platform: 'all',
      sort: 'newest',
      layout: filters.layout,
    });
  };

  const layout = filters.layout || 'list';

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search meetings by title or participant name..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="h-8 pl-8 text-xs bg-card"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({
                ...filters,
                status: e.target.value as MeetingFiltersState['status'],
              })
            }
            aria-label="Filter by Status"
            className="h-8 rounded-md border border-input bg-card px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="ready">Ready</option>
            <option value="processing">Processing</option>
            <option value="scheduled">Scheduled</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Platform Filter */}
          <select
            value={filters.platform}
            onChange={(e) =>
              onChange({
                ...filters,
                platform: e.target.value as MeetingFiltersState['platform'],
              })
            }
            aria-label="Filter by Platform"
            className="h-8 rounded-md border border-input bg-card px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">All Platforms</option>
            <option value="meet">Google Meet</option>
            <option value="zoom">Zoom</option>
            <option value="teams">Microsoft Teams</option>
            <option value="upload">Uploaded File</option>
          </select>

          {/* Sort Filter */}
          <select
            value={filters.sort}
            onChange={(e) =>
              onChange({
                ...filters,
                sort: e.target.value as MeetingFiltersState['sort'],
              })
            }
            aria-label="Sort Order"
            className="h-8 rounded-md border border-input bg-card px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="longest">Longest Duration</option>
          </select>

          {/* List / Grid view switcher */}
          <div className="hidden sm:flex items-center rounded-md border border-border bg-card p-0.5">
            <button
              type="button"
              onClick={() => onChange({ ...filters, layout: 'list' })}
              aria-label="List view"
              className={`rounded p-1 transition-colors ${
                layout === 'list'
                  ? 'bg-secondary text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="List View"
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...filters, layout: 'grid' })}
              aria-label="Grid view"
              className={`rounded p-1 transition-colors ${
                layout === 'grid'
                  ? 'bg-secondary text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Result Metrics */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3 w-3 opacity-60" />
          <span>
            {loading ? (
              'Loading meetings…'
            ) : (
              <>
                Showing{' '}
                <strong className="text-foreground">{filteredCount}</strong> of{' '}
                {totalCount} meetings
              </>
            )}
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
              Filtered
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
