import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
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
import { Evidence } from './board-view';
const decisionLabel = (status: string): string => ({ WITHDRAWN: 'Withdrawn', ACTIVE: 'Active · Confirmed decision', REVISED: 'Revised', CONFLICTING: 'Conflicting · Needs review', CONDITIONAL: 'Conditional · Prerequisite unverified', ESTIMATE: 'Estimate', SUGGESTION: 'Suggestion', CONFIRMED: 'Confirmed decision', PROPOSED: 'Proposed plan', CANCELLED: 'Cancelled', SUPERSEDED: 'Superseded' } as Record<string, string>)[status] ?? status;
interface Decision {
  id: string;
  title: string;
  description: string;
  status: string;
  originalStatus: string;
  evidence: unknown;
  createdAt: string;
  meeting: { id: string; title: string; startAt: string };
  events: { id: string; eventType: string; createdAt: string }[];
}
interface Conflict {
  id: string;
  status: string;
  explanation: string;
  previousDecision: Decision;
  newDecision: Decision;
}
interface Action {
  id: string;
  meetingId: string;
  type: string;
  title: string;
  instructions: string;
  status: string;
  generatedContent: string | null;
  evidence: unknown;
  error: string | null;
  proposedChanges: { status?: string; dueDate?: string; note?: string } | null;
  meeting: { id: string; title: string; startAt: string };
  targetActionItem?: {
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
  } | null;
}
interface Intelligence {
  reconciliation?: 'pending' | 'failed' | 'unavailable' | null;
  decisions: Decision[];
  conflicts: Conflict[];
  actions: Action[];
}
export function IntelligenceView({
  mode = 'decisions',
  projectId: explicitProject,
  meetingId,
  compact = false,
}: {
  mode?: 'decisions' | 'actions';
  projectId?: string;
  meetingId?: string;
  compact?: boolean;
}) {
  const context = useProjectContext();
  const projectId = explicitProject ?? context.projectId;
  const invalidate = useExecutionInvalidation();
  const [pending, setPending] = React.useState<string | null>(null);
  const [view, setView] = React.useState<Action | null>(null);
  const [review, setReview] = React.useState<{
    kind: 'conflict' | 'action';
    item: Action | Conflict;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const query = useQuery({
    queryKey: ['intelligence', projectId, meetingId],
    enabled: Boolean(projectId),
    queryFn: ({ signal }) =>
      apiClient<Intelligence>(
        `/projects/${projectId}/intelligence${meetingId ? `?meetingId=${meetingId}` : ''}`,
        { signal },
      ),
    staleTime: 20_000,
    retry: false,
    refetchInterval: (q) =>
      q.state.data?.reconciliation === 'pending' || q.state.data?.actions.some((a) =>
        ['QUEUED', 'RUNNING'].includes(a.status),
      )
        ? 2500
        : false,
  });
  const act = async (path: string, body: unknown, id: string) => {
    setPending(id);
    setError(null);
    try {
      const result = await apiClient<Action>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      invalidate();
      setReview(null);
      if (result.generatedContent) setView(result);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this change.');
      return false;
    } finally {
      setPending(null);
    }
  };
  const actions = (query.data?.actions ?? []).filter((a) =>
    !['COMMITMENT_UPDATE', 'COMMITMENT_MENTION'].includes(a.type),
  );
  if (!projectId)
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Select a project above to view its{' '}
        {mode === 'decisions'
          ? 'decision memory'
          : 'AI actions'}
        .
      </div>
    );
  return (
    <div
      className={
        compact ? 'flex min-h-0 max-h-[min(36rem,70vh)] flex-col gap-3' : 'mx-auto max-w-6xl space-y-5 p-4 sm:p-6'
      }
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <h1
            className={
              compact ? 'text-xs font-semibold' : 'text-xl font-semibold'
            }
          >
            {mode === 'decisions'
              ? 'Decision Memory'
              : 'AI Actions'}
          </h1>
          {!compact && (
            <p className="text-xs text-muted-foreground">
              {mode === 'decisions' ? 'Current decisions, unresolved dependencies and preserved history, ordered by meeting date.' : 'Useful drafts grounded in your meetings.'}
            </p>
          )}
        </div>
        {meetingId && mode === 'actions' && (
          <Button
            size="sm"
            variant="outline"
            disabled={Boolean(pending)}
            onClick={() =>
              void act(
                `/meetings/${meetingId}/suggestions/refresh`,
                {},
                'refresh',
              ).then((ok) => {
                if (ok)
                  toast.success(
                    'Saved suggestions refreshed; dismissed items remain excluded.',
                  );
              })
            }
          >
            {pending === 'refresh' ? 'Refreshing…' : 'Refresh'}
          </Button>
        )}
      </header>
      {mode === 'decisions' && query.data?.reconciliation && (
        <p role="status" className="rounded-lg border border-amber-200/40 bg-amber-50/30 p-3 text-xs text-muted-foreground dark:bg-amber-100/5">
          {query.data.reconciliation === 'pending' ? 'Reconciling saved decision history… Original sources remain available below.' : 'Decision reconciliation is unavailable. Saved history is shown; decision changes have not been fully checked. Retry meeting processing after the worker is available.'}
        </p>
      )}
      <div className={compact ? 'intelligence-scroll min-h-0 overflow-y-auto overscroll-contain pr-1' : undefined} tabIndex={compact ? 0 : undefined} aria-label={compact ? 'AI action suggestions' : undefined}>
      {query.isPending ? (
        <Skeleton className="h-32" />
      ) : query.error ? (
        <div role="alert" className="text-xs">
          {query.error.message}
          <Button variant="outline" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </div>
      ) : mode === 'decisions' ? (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Decision changes & conflicts</h2>
            {query.data?.conflicts.length ? (
              query.data.conflicts.map((conflict) => (
                <article
                  key={conflict.id}
                  className="space-y-3 rounded-xl border bg-card p-4"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {conflict.status === 'PENDING' ? 'Needs review · Potential conflict' : conflict.status === 'DISMISSED' ? 'Dismissed relationship' : conflict.status === 'WITHDRAWN' ? 'Previous decision withdrawn' : conflict.status === 'REVISED' ? 'Revised decision' : conflict.status === 'REAFFIRMED' ? 'Reaffirmed decision' : 'Confirmed change · Superseded'}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[conflict.previousDecision, conflict.newDecision].map(
                      (d) => (
                        <div key={d.id} className="rounded-lg bg-muted/30 p-3">
                          <p className="text-sm font-medium">{d.title}</p>
                          <p className="mt-1 text-xs leading-relaxed">
                            {d.description.trim().toLowerCase() !== d.title.trim().toLowerCase() ? d.description : null}
                          </p>
                          <p className="my-2 text-[11px] text-muted-foreground">
                            {decisionLabel(d.status)} · {d.meeting.title} ·{' '}
                            {new Date(d.meeting.startAt).toLocaleString()}
                          </p>
                          <Evidence value={d.evidence} />
                        </div>
                      ),
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {conflict.explanation.replace(/^\[memory-v2\]\s*/, '')}
                  </p>
                  {conflict.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={Boolean(pending)}
                        onClick={() =>
                          setReview({ kind: 'conflict', item: conflict })
                        }
                      >
                        Review relationship
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Boolean(pending)}
                        onClick={() =>
                          void act(
                            `/projects/${projectId}/conflicts/${conflict.id}/review`,
                            { decision: 'dismiss' },
                            conflict.id,
                          )
                        }
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </article>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                {query.data?.reconciliation ? 'Decision comparisons are not yet complete.' : 'No reconciled decision relationships yet.'}
              </p>
            )}
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Current decisions & history</h2>
            {query.data?.decisions.length ? (
              query.data.decisions.map((decision) => (
                <article
                  key={decision.id}
                  className="relative space-y-3 rounded-xl border border-l-2 border-l-primary/40 bg-card p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-medium">{decision.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${['ACTIVE', 'CONFIRMED'].includes(decision.status) ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                      {decisionLabel(decision.status)}
                    </span>
                  </div>
                  {decision.description.trim().toLowerCase() !== decision.title.trim().toLowerCase() && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{decision.description}</p>
                  )}
                  <Link
                    className="text-xs text-primary"
                    to="/meetings/$meetingId"
                    params={{ meetingId: decision.meeting.id }}
                  >
                    {decision.meeting.title} ·{' '}
                    {new Date(decision.meeting.startAt).toLocaleString()}
                  </Link>
                  <Evidence value={decision.evidence} />
                  {decision.events.map((event) => (
                    <p
                      key={event.id}
                      className="text-[11px] text-muted-foreground"
                    >
                      {event.eventType.toLowerCase().replaceAll('_', ' ')} ·{' '}
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  ))}
                </article>
              ))
            ) : (
              <p className="rounded-lg border border-dashed p-5 text-xs text-muted-foreground">
                No decisions have been captured for this project yet.
              </p>
            )}
          </section>
        </>
      ) : (
        <div className="space-y-3">
          {actions.length ? (
            actions.map((action) => (
              <article
                key={action.id}
                className={`space-y-2 rounded-lg border bg-card p-3 ${action.status === 'DISMISSED' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-semibold">{action.title}</h3>
                  <span className="text-[10px] text-muted-foreground">
                    {action.status}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {action.instructions}
                </p>
                {!compact && (
                  <Link
                    className="text-xs text-primary"
                    to="/meetings/$meetingId"
                    params={{ meetingId: action.meetingId }}
                  >
                    {action.meeting.title}
                  </Link>
                )}
                <Evidence value={action.evidence} />
                {action.proposedChanges?.note && (
                  <p className="text-xs">{action.proposedChanges.note}</p>
                )}
                {action.targetActionItem && (
                  <p className="text-xs">
                    Current task: {action.targetActionItem.status}
                    {action.proposedChanges?.status
                      ? ` → Proposed: ${action.proposedChanges.status}`
                      : ''}
                    {action.proposedChanges?.dueDate
                      ? ` · Proposed deadline: ${new Date(action.proposedChanges.dueDate).toLocaleDateString()}`
                      : ''}
                  </p>
                )}
                {action.error && (
                  <p role="alert" className="text-xs text-destructive">
                    {action.error}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {!['DISMISSED', 'APPLIED','TRACKED'].includes(action.status) &&
                    (action.type === 'COMMITMENT_UPDATE' ? (
                      <Button
                        size="sm"
                        disabled={Boolean(pending)}
                        onClick={() =>
                          setReview({ kind: 'action', item: action })
                        }
                      >
                        Review change
                      </Button>
                    ) : action.generatedContent ? (
                      <Button size="sm" onClick={() => setView(action)}>
                        Open saved draft
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={
                          Boolean(pending) ||
                          ['QUEUED', 'RUNNING'].includes(action.status)
                        }
                        onClick={() =>
                          void act(
                            `/projects/${projectId}/ai-actions/${action.id}/generate`,
                            { retry: action.status === 'FAILED' },
                            action.id,
                          )
                        }
                      >
                        {['QUEUED', 'RUNNING'].includes(action.status)
                          ? 'Generating…'
                          : action.status === 'FAILED'
                            ? 'Retry generation'
                            : 'Generate draft'}
                      </Button>
                    ))}
                  {!['DISMISSED', 'APPLIED','TRACKED'].includes(action.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={Boolean(pending)}
                      onClick={() =>
                        void act(
                          `/projects/${projectId}/ai-actions/${action.id}/review`,
                          { decision: 'dismiss' },
                          action.id,
                        )
                      }
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
              No grounded suggestions yet. Suggestions are saved automatically when transcript processing finishes.
            </p>
          )}
        </div>
      )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <Dialog
        open={Boolean(review)}
        onOpenChange={(open) => {
          if (!open && !pending) setReview(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm project change</DialogTitle>
            <DialogDescription>
              {review?.kind === 'conflict'
                ? 'Confirming preserves both decisions and marks the previous statement as superseded.'
                : 'Confirm only if the transcript supports updating this existing task. A newer task version will block a stale proposal.'}
            </DialogDescription>
          </DialogHeader>
          {review?.kind === 'action' && (
            <Evidence value={(review.item as Action).evidence} />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={Boolean(pending)}
              onClick={() => setReview(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={Boolean(pending)}
              onClick={() => {
                if (review)
                  void act(
                    `/projects/${projectId}/${review.kind === 'conflict' ? 'conflicts' : 'ai-actions'}/${review.item.id}/review`,
                    { decision: 'confirm' },
                    review.item.id,
                  );
              }}
            >
              {pending ? 'Applying…' : 'Confirm change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(view)}
        onOpenChange={(open) => {
          if (!open) setView(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{view?.title}</DialogTitle>
            <DialogDescription>
              Saved draft · Nothing has been sent or executed.
            </DialogDescription>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {view?.generatedContent}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                void navigator.clipboard
                  .writeText(view?.generatedContent ?? '')
                  .then(() => toast.success('Draft copied'))
                  .catch(() => toast.error('Could not copy draft.'));
              }}
            >
              Copy draft
            </Button>
            <Button onClick={() => setView(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function MeetingExecutionPanel({
  meetingId,
  projectId,
}: {
  meetingId: string;
  projectId: string;
}) {
  return (
    <div className="space-y-4">
      <IntelligenceView
        compact
        mode="actions"
        meetingId={meetingId}
        projectId={projectId}
      />
   </div>
  );
}
