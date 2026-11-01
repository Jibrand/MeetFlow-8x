import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { ActionItemData } from '../../types/meeting';
import { ActionItemRow, Input, Button, Badge, EmptyState, toast } from '@meetflow/ui';
import { Search, CheckCircle2, Clock, CheckSquare } from 'lucide-react';
import {
  getMergedActionItems,
  toggleActionItemCompleted,
  subscribeToActionItemChanges,
} from '../meeting-detail/lib/action-items-store';

export function ActionItemsView() {
  const [actionItems, setActionItems] = React.useState<ActionItemData[]>(() =>
    getMergedActionItems()
  );

  React.useEffect(() => {
    const unsubscribe = subscribeToActionItemChanges(() => {
      setActionItems(getMergedActionItems());
    });
    return unsubscribe;
  }, []);

  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'open' | 'completed'>('all');

  const handleToggle = (id: string, completed: boolean) => {
    toggleActionItemCompleted(id, completed);
    if (completed) {
      toast.success('Task marked completed');
    }
  };

  const filteredItems = React.useMemo(() => {
    return actionItems.filter((item) => {
      if (filter === 'open' && item.completed) return false;
      if (filter === 'completed' && !item.completed) return false;
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
  }, [actionItems, filter, search]);

  const openCount = actionItems.filter((i) => !i.completed).length;
  const completedCount = actionItems.filter((i) => i.completed).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Action Items
            </h1>
            <Badge variant="secondary" className="text-xs">
              {openCount} Open
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Extracted automated action items and assigned deliverables across all meeting calls.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border/50">
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

      {/* Task List */}
      {filteredItems.length > 0 ? (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <div key={item.id} className="space-y-1">
              <ActionItemRow
                id={item.id}
                title={item.title}
                completed={item.completed}
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
