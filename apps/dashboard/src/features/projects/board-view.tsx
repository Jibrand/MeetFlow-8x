import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Input,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Skeleton,
  toast,
} from '@meetflow/ui';
import { apiClient } from '../../lib/api-client';
import { useProjectContext, useExecutionInvalidation } from './project-context';
export interface Task {
  id: string;
  projectId: string;
  meetingId: string | null;
  title: string;
  description: string | null;
  assigneeName: string | null;
  priority: string;
  dueDate: string | null;
  status: string;
  position: number;
  version: number;
  archivedAt: string | null;
  evidence: unknown;
  meeting?: { id: string; title: string } | null;
  history?: {
    id: string;
    eventType: string;
    evidence: unknown;
    createdAt: string;
    meeting?: { id: string; title: string } | null;
  }[];
}
const columns = [
  ['TODO', 'To Do'],
  ['IN_PROGRESS', 'In Progress'],
  ['BLOCKED', 'Blocked'],
  ['DONE', 'Done'],
];
export function BoardView() {
  const { projectId } = useProjectContext();
  const client = useQueryClient();
  const invalidate = useExecutionInvalidation();
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [owner, setOwner] = React.useState('');
  const [priority, setPriority] = React.useState('');
  const [archived, setArchived] = React.useState(false);
  const [editing, setEditing] = React.useState<Task | null | undefined>(
    undefined,
  );
  const [drag, setDrag] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(timer);
  }, [search]);
  React.useEffect(() => {
    setEditing(undefined);
    setOwner('');
    setPriority('');
  }, [projectId]);
  const key = [
    'board',
    projectId,
    { search: debounced, owner, priority, archived },
  ];
  const query = useQuery({
    queryKey: key,
    enabled: Boolean(projectId),
    queryFn: ({ signal }) => {
      const q = new URLSearchParams({
        search: debounced,
        archived: String(archived),
      });
      if (owner) q.set('owner', owner);
      if (priority) q.set('priority', priority);
      return apiClient<{
        tasks: Task[];
        owners: string[];
        truncated: boolean;
        counts: { status: string; _count: number }[];
      }>(`/projects/${projectId}/board?${q}`, { signal });
    },
    staleTime: 20_000,
    retry: false,
  });
  const move = async (task: Task, status: string, beforeId?: string) => {
    if (!projectId || pending) return;
    setPending(true);
    await client.cancelQueries({ queryKey: ['board', projectId] });
    const old = client.getQueryData<typeof query.data>(key);
    const list = (query.data?.tasks ?? [])
      .filter((t) => t.status === status && t.id !== task.id)
      .sort((a, b) => a.position - b.position);
    const at = beforeId
      ? list.findIndex((t) => t.id === beforeId)
      : list.length;
    const before = list[at];
    const after = list[at - 1];
    const position =
      before && after
        ? (before.position + after.position) / 2
        : before
          ? before.position - 1024
          : after
            ? after.position + 1024
            : 0;
    client.setQueryData(key, (data: typeof query.data) =>
      data
        ? {
            ...data,
            tasks: data.tasks.map((t) =>
              t.id === task.id ? { ...t, status, position } : t,
            ),
            counts: data.counts.map((c) => ({
              ...c,
              _count:
                c._count +
                (task.status === status
                  ? 0
                  : c.status === status
                    ? 1
                    : c.status === task.status
                      ? -1
                      : 0),
            })),
          }
        : data,
    );
    try {
      await apiClient(`/projects/${projectId}/tasks/${task.id}/move`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          beforeId: before?.id,
          afterId: after?.id,
          version: task.version,
        }),
      });
    } catch (e) {
      client.setQueryData(key, old);
      toast.error(e instanceof Error ? e.message : 'Could not move task.');
    } finally {
      setPending(false);
      setDrag(null);
      invalidate();
    }
  };
  if (!projectId)
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Select a company and project above to open its board.
      </div>
    );
  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Project Board</h1>
          <p className="text-xs text-muted-foreground">
            One task record, synchronized across meetings and execution.
          </p>
        </div>
        <Button onClick={() => setEditing(null)}>+ Add task</Button>
      </header>
      <div className="flex flex-wrap gap-2">
        <Input
          className="w-full sm:w-64"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Filter owner"
          className="rounded border bg-card px-3 text-xs"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
        >
          <option value="">All owners</option>
          {query.data?.owners.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <select
          aria-label="Filter priority"
          className="rounded border bg-card px-3 text-xs"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="">All priorities</option>
          {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <Button variant="outline" onClick={() => setArchived(!archived)}>
          {archived ? 'Show active' : 'Show archived'}
        </Button>
      </div>
      {query.error && (
        <div role="alert" className="text-sm text-destructive">
          {query.error.message}{' '}
          <Button variant="outline" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </div>
      )}
      {query.data?.truncated && (
        <p className="text-xs text-muted-foreground">
          Showing the first 1,000 matching tasks. Refine filters to narrow the
          board.
        </p>
      )}
      <div className="grid grid-cols-[repeat(4,minmax(260px,1fr))] gap-4 overflow-x-auto pb-4">
        {columns.map(([status, label]) => {
          const tasks = (query.data?.tasks ?? [])
            .filter((t) => t.status === status)
            .sort(
              (a, b) => a.position - b.position || a.id.localeCompare(b.id),
            );
          return (
            <section
              key={status}
              className={`min-h-72 rounded-xl border bg-muted/20 p-3 transition-colors ${drag ? 'border-primary/40' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (drag) {
                  const task = query.data?.tasks.find((t) => t.id === drag);
                  if (task) void move(task, status);
                }
              }}
            >
              <h2 className="mb-3 flex items-center justify-between text-xs font-semibold">
                {label}
                <span className="rounded bg-muted px-2 py-0.5">
                  {query.data?.counts.find((c) => c.status === status)
                    ?._count ?? tasks.length}
                </span>
              </h2>
              {query.isPending ? (
                <Skeleton className="h-32" />
              ) : tasks.length ? (
                tasks.map((task) => (
                  <article
                    key={task.id}
                    draggable={!pending && !archived}
                    onDragStart={(e) => {
                      setDrag(task.id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', task.id);
                    }}
                    onDragEnd={() => setDrag(null)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const item = query.data?.tasks.find((t) => t.id === drag);
                      if (item && item.id !== task.id)
                        void move(item, status, task.id);
                    }}
                    className={`mb-3 space-y-3 rounded-lg border bg-card p-3 shadow-xs transition-opacity ${drag === task.id ? 'opacity-40' : ''}`}
                  >
                    <button
                      type="button"
                      className="w-full text-left text-sm font-medium hover:text-primary"
                      onClick={() => setEditing(task)}
                    >
                      {task.title}
                    </button>
                    <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                      <span>{task.assigneeName || 'Unassigned'}</span>
                      <span>{task.priority}</span>
                      {task.dueDate && (
                        <span
                          className={
                            status !== 'DONE' &&
                            new Date(task.dueDate) < new Date()
                              ? 'text-destructive'
                              : ''
                          }
                        >
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <select
                        disabled={pending || archived}
                        aria-label={`Move ${task.title}`}
                        className="min-w-0 flex-1 rounded border bg-background px-1 py-1 text-[11px]"
                        value={status}
                        onChange={(e) => void move(task, e.target.value)}
                      >
                        {columns.map(([s, l]) => (
                          <option key={s} value={s}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={
                          pending || archived || tasks[0].id === task.id
                        }
                        aria-label={`Move ${task.title} earlier`}
                        onClick={() =>
                          void move(
                            task,
                            status,
                            tasks[tasks.indexOf(task) - 1]?.id,
                          )
                        }
                      >
                        ↑
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={
                          pending || archived || tasks.at(-1)?.id === task.id
                        }
                        aria-label={`Move ${task.title} later`}
                        onClick={() =>
                          void move(
                            task,
                            status,
                            tasks[tasks.indexOf(task) + 2]?.id,
                          )
                        }
                      >
                        ↓
                      </Button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-lg border border-dashed p-5 text-xs text-muted-foreground">
                  {query.error
                    ? 'Tasks are unavailable.'
                    : 'Drop a task here or add one to get started.'}
                </p>
              )}
            </section>
          );
        })}
      </div>
      {editing !== undefined && (
        <TaskDialog
          task={editing}
          projectId={projectId}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
export function TaskDialog({
  task,
  projectId,
  onClose,
}: {
  task: Task | null;
  projectId: string;
  onClose: () => void;
}) {
  const invalidate = useExecutionInvalidation();
  const [title, setTitle] = React.useState(task?.title ?? '');
  const [description, setDescription] = React.useState(task?.description ?? '');
  const [owner, setOwner] = React.useState(task?.assigneeName ?? '');
  const [priority, setPriority] = React.useState(task?.priority ?? 'MEDIUM');
  const [due, setDue] = React.useState(task?.dueDate?.slice(0, 10) ?? '');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState(false);
  const history = useQuery({
    queryKey: ['task', projectId, task?.id],
    enabled: Boolean(task),
    queryFn: () => apiClient<Task>(`/projects/${projectId}/tasks/${task!.id}`),
    retry: false,
  });
  const act = async (operation: string) => {
    setBusy(true);
    setError(null);
    try {
      if (operation === 'save')
        await apiClient(task ? `/action-items/${task.id}` : '/action-items', {
          method: task ? 'PATCH' : 'POST',
          body: JSON.stringify({
            ...(task
              ? { version: history.data?.version ?? task.version }
              : { projectId }),
            title: title.trim(),
            description,
            assigneeName: owner || null,
            priority,
            dueDate: due ? new Date(`${due}T12:00:00`).toISOString() : null,
          }),
        });
      else if (operation === 'delete')
        await apiClient(`/action-items/${task!.id}`, { method: 'DELETE' });
      else
        await apiClient(
          `/projects/${projectId}/tasks/${task!.id}/${operation}`,
          { method: 'POST', body: '{}' },
        );
      invalidate();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save task.');
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Task details' : 'Add project task'}
          </DialogTitle>
          <DialogDescription>
            Task changes synchronize across this project’s board and meeting
            views.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void act('save');
          }}
          className="space-y-3"
        >
          <fieldset disabled={busy} className="space-y-3">
            <label className="block text-xs">
              Title
              <Input
                required
                maxLength={255}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="block text-xs">
              Description
              <Textarea
                maxLength={10000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs">
                Owner name
                <Input
                  value={owner}
                  maxLength={100}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </label>
              <label className="text-xs">
                Deadline
                <Input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs">
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="rounded border bg-card p-2"
              >
                {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          </fieldset>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button disabled={busy || !title.trim()}>
              {busy ? 'Saving…' : 'Save task'}
            </Button>
          </DialogFooter>
        </form>
        {task && (
          <>
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void act('duplicate')}
              >
                Duplicate
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void act(task.archivedAt ? 'restore' : 'archive')
                }
              >
                {task.archivedAt ? 'Restore' : 'Archive'}
              </Button>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() => setConfirm(true)}
              >
                Delete
              </Button>
            </div>
            {task.meeting && (
              <Link
                to="/meetings/$meetingId"
                params={{ meetingId: task.meeting.id }}
                className="text-xs text-primary"
              >
                Source: {task.meeting.title}
              </Link>
            )}
            <Evidence value={history.data?.evidence ?? task.evidence} />
            <section className="space-y-2">
              <h3 className="text-xs font-semibold">Activity history</h3>
              {history.isPending ? (
                <Skeleton className="h-16" />
              ) : history.error ? (
                <p role="alert" className="text-xs">
                  {history.error.message}
                </p>
              ) : (
                history.data?.history?.map((event) => (
                  <div key={event.id} className="rounded border p-2 text-xs">
                    <p>
                      {event.eventType} ·{' '}
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                    <ActivityChanges value={event.evidence} />
                    <Evidence value={event.evidence} />
                  </div>
                ))
              )}
            </section>
          </>
        )}
        <Dialog
          open={confirm}
          onOpenChange={(open) => {
            if (!busy) setConfirm(open);
          }}
        >
          <DialogContent role="alertdialog">
            <DialogHeader>
              <DialogTitle>Delete this task?</DialogTitle>
              <DialogDescription>
                The task disappears from active views. Its audit history is
                retained.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() => void act('delete')}
              >
                {busy ? 'Deleting…' : 'Delete task'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
function ActivityChanges({ value }: { value: unknown }) {
  if (!value || typeof value !== 'object') return null;
  const v = value as {
    changes?: Record<string, unknown>;
    fromStatus?: string;
    toStatus?: string;
    status?: string;
  };
  return (
    <div className="mt-1 space-y-1 text-muted-foreground">
      {v.fromStatus && v.toStatus && (
        <p>
          {v.fromStatus} → {v.toStatus}
        </p>
      )}
      {v.status && <p>Status: {v.status}</p>}
      {Object.entries(v.changes ?? {})
        .filter(([key]) =>
          [
            'title',
            'description',
            'assigneeName',
            'priority',
            'status',
            'dueDate',
            'note',
          ].includes(key),
        )
        .map(([key, value]) => (
          <p key={key} className="whitespace-pre-wrap">
            {key === 'assigneeName'
              ? 'Owner'
              : key === 'dueDate'
                ? 'Deadline'
                : key}
            : {value === null ? 'Cleared' : String(value)}
          </p>
        ))}
    </div>
  );
}
export function Evidence({ value }: { value: unknown }) {
  const data = Array.isArray(value)
    ? value
    : typeof value === 'object' && value && 'source' in value
      ? (value as { source: unknown }).source
      : [];
  if (!Array.isArray(data) || !data.length) return null;
  return (
    <div className="space-y-2">
      {data.map((item: unknown, i) => {
        if (!item || typeof item !== 'object') return null;
        const e = item as {
          quote?: string;
          startMs?: number;
          meetingId?: string;
          kind?: string;
        };
        return (
          <blockquote
            key={i}
            className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed"
          >
            <p className="whitespace-pre-wrap">{e.quote}</p>
            {e.startMs != null && (
              <span className="text-muted-foreground">
                {Math.floor(e.startMs / 60000)}:
                {String(Math.floor(e.startMs / 1000) % 60).padStart(2, '0')}
              </span>
            )}
            {e.kind === 'saved-summary' && (
              <span className="text-muted-foreground">
                Saved summary evidence
              </span>
            )}
          </blockquote>
        );
      })}
    </div>
  );
}
