import { PageSkeleton } from '../../components/page-skeleton';
import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { useToggleActionItem } from './use-toggle-action-item';
import { ActionItemRow, Input, Button, Badge, EmptyState } from '@meetflow/ui';
import {
  Search,
  CheckCircle2,
  Clock,
  CheckSquare,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

import { isOverdue, useActionItemsQuery } from './use-action-items';
import { Pagination } from '../../components/ui/pagination';

const PAGE_SIZE = 8;

export function ActionItemsView() {
  const taskToggle = useToggleActionItem();
  const query = useActionItemsQuery();
  const actionItems = query.data ?? [];
  const loading = query.isPending;
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<
    'all' | 'open' | 'completed' | 'overdue'
  >('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const now = React.useMemo(() => new Date(), []);

  // Reset page when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const handleToggle = taskToggle.toggle;

  const overdueCount = React.useMemo(
    () => actionItems.filter((i) => isOverdue(i, now)).length,
    [actionItems, now],
  );
  const openCount = actionItems.filter((i) => !i.completed).length;
  const completedCount = actionItems.filter((i) => i.completed).length;

  const filteredItems = React.useMemo(() => {
    return actionItems.filter((item) => {
      if (filter === 'open' && item.completed) return false;
      if (filter === 'completed' && !item.completed) return false;
      if (filter === 'overdue' && !isOverdue(item, now)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.assigneeName?.toLowerCase().includes(q) ||
          item.meetingTitle?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [actionItems, filter, search, now]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedItems = React.useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, safeCurrentPage]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Action Items
            </h1>
            <Badge variant="secondary" className="text-xs">
              {loading ? 'Loading…' : `${openCount} Open`}
            </Badge>
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                <span>{overdueCount} Overdue</span>
              </Badge>
            )}
            {loading && (
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground ml-1" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Extracted automated action items and assigned deliverables across
            all meeting calls.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-secondary/80 p-1 rounded-lg border border-border">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className="h-7 text-xs px-2.5"
          >
            All ({actionItems.length})
          </Button>
          <Button
            variant={filter === 'open' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('open')}
            className="h-7 text-xs px-2.5 gap-1"
          >
            <Clock className="h-3 w-3" />
            <span>Open ({openCount})</span>
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('completed')}
            className="h-7 text-xs px-2.5 gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Done ({completedCount})</span>
          </Button>
          {overdueCount > 0 && (
            <Button
              variant={filter === 'overdue' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('overdue')}
              className="h-7 text-xs px-2.5 gap-1 text-destructive hover:text-destructive"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Overdue ({overdueCount})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Filter tasks by title, assignee, or meeting..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-8 text-xs bg-card"
        />
      </div>

      {query.isError && query.data && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 p-3 text-xs"
        >
          <span>Could not refresh data. {query.error.message}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void query.refetch();
            }}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Task List Workspace inside Bounded Surface */}
      {loading ? (
        <PageSkeleton kind="actions" />
      ) : query.isError && !query.data ? (
        <div role="alert" className="p-6 space-y-3">
          <p>{query.error.message}</p>
          <Button
            variant="outline"
            onClick={() => {
              void query.refetch();
            }}
          >
            Try Again
          </Button>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-4">
          <div className="divide-y divide-border">
            {pagedItems.map((item) => (
              <div
                key={item.id}
                className="py-3 first:pt-0 last:pb-0 space-y-1"
              >
                <ActionItemRow
                  id={item.id}
                  title={item.title}
                  completed={item.completed}
                  pending={taskToggle.pendingIds.has(item.id)}
                  onToggleCompleted={(val) => handleToggle(item.id, val)}
                  assigneeName={item.assigneeName}
                  dueDate={item.dueDate}
                  priority={item.priority}
                  timestampSeconds={item.timestampSeconds}
                />
                {item.meetingTitle && (
                  <div className="flex items-center gap-1.5 pl-3 text-[11px] text-muted-foreground">
                    <span>Source:</span>
                    <Link
                      to="/meetings/$meetingId"
                      params={{ meetingId: item.meetingId }}
                      className="font-medium text-foreground/80 hover:text-primary transition-colors underline-offset-2 hover:underline truncate max-w-md"
                    >
                      {item.meetingTitle}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={filteredItems.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        <EmptyState
          icon={<CheckSquare className="h-5 w-5" />}
          title="No action items found"
          description="Try clearing your search query or switching your status filter."
          actionLabel="View All Tasks"
          onAction={() => {
            setFilter('all');
            setSearch('');
          }}
        />
      )}
    </div>
  );
}
