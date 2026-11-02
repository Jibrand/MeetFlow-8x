import {
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from '@meetflow/ui';
import {
  apiUpdateActionItem,
  type OverviewStatsResponse,
} from '../meetings/meetings-api';
import { workspaceScope } from '../meetings/use-meetings';
import type { ActionItemData } from '../../types/meeting';
import type { apiFetchMeeting } from '../meetings/meetings-api';

type Detail = Awaited<ReturnType<typeof apiFetchMeeting>>;
interface Toggle {
  id: string;
  completed: boolean;
}
export function useToggleActionItem() {
  const client = useQueryClient();
  const scope = workspaceScope();
  const mutationKey = ['toggle-action-item', scope];
  const pending = useMutationState({
    filters: { mutationKey, status: 'pending' },
    select: (mutation) => (mutation.state.variables as Toggle | undefined)?.id,
  });
  const pendingIds = new Set(pending.filter((id): id is string => Boolean(id)));
  const mutation = useMutation({
    mutationKey,
    mutationFn: ({ id, completed }: Toggle) =>
      apiUpdateActionItem(id, { status: completed ? 'DONE' : 'TODO' }),
    onMutate: async ({ id, completed }) => {
      await Promise.all(
        ['action-items', 'meeting', 'overview'].map((key) =>
          client.cancelQueries({ queryKey: [key, scope] }),
        ),
      );
      const lists = client.getQueriesData<ActionItemData[]>({
        queryKey: ['action-items', scope],
      });
      const details = client.getQueriesData<Detail>({
        queryKey: ['meeting', scope],
      });
      const original =
        lists
          .flatMap(([, items]) => items ?? [])
          .find((item) => item.id === id) ??
        details
          .flatMap(([, detail]) => detail?.meeting.actionItems ?? [])
          .find((item) => item.id === id);
      const patch = (items: ActionItemData[]) =>
        items.map((item) => (item.id === id ? { ...item, completed } : item));
      client.setQueriesData<ActionItemData[]>(
        { queryKey: ['action-items', scope] },
        (items) => (items ? patch(items) : items),
      );
      client.setQueriesData<Detail>(
        { queryKey: ['meeting', scope] },
        (detail) =>
          detail
            ? {
                ...detail,
                meeting: {
                  ...detail.meeting,
                  actionItems: patch(detail.meeting.actionItems ?? []),
                },
              }
            : detail,
      );
      const overview = client.getQueryData<OverviewStatsResponse>([
        'overview',
        scope,
      ]);
      const delta =
        original && original.completed !== completed ? (completed ? 1 : -1) : 0;
      const overdueDelta =
        original?.dueDate && new Date(original.dueDate) < new Date()
          ? delta
          : 0;
      client.setQueriesData<OverviewStatsResponse>(
        { queryKey: ['overview', scope] },
        (stats) =>
          stats
            ? {
                ...stats,
                openActionItems: stats.openActionItems - delta,
                completedActionItems: stats.completedActionItems + delta,
                overdueActionItems: stats.overdueActionItems - overdueDelta,
                attentionItems: stats.attentionItems.map((item) =>
                  item.id === id
                    ? { ...item, status: completed ? 'DONE' : 'TODO' }
                    : item,
                ),
              }
            : stats,
      );
      return { lists, details, delta, overdueDelta, overview };
    },
    onError: (error, { id }, context) => {
      // Restore this item only, so a failed task cannot roll back another in-flight task.
      for (const [key, oldItems] of context?.lists ?? []) {
        const old = oldItems?.find((item) => item.id === id);
        if (old)
          client.setQueryData<ActionItemData[]>(key, (items) =>
            items?.map((item) => (item.id === id ? old : item)),
          );
      }
      for (const [key, oldDetail] of context?.details ?? []) {
        const old = oldDetail?.meeting.actionItems?.find(
          (item) => item.id === id,
        );
        if (old)
          client.setQueryData<Detail>(key, (detail) =>
            detail
              ? {
                  ...detail,
                  meeting: {
                    ...detail.meeting,
                    actionItems: detail.meeting.actionItems?.map((item) =>
                      item.id === id ? old : item,
                    ),
                  },
                }
              : detail,
          );
      }
      if (context)
        client.setQueriesData<OverviewStatsResponse>(
          { queryKey: ['overview', scope] },
          (stats) =>
            stats
              ? {
                  ...stats,
                  openActionItems: stats.openActionItems + context.delta,
                  completedActionItems:
                    stats.completedActionItems - context.delta,
                  overdueActionItems:
                    stats.overdueActionItems + context.overdueDelta,
                  attentionItems: stats.attentionItems.map((item) =>
                    item.id === id
                      ? (context.overview?.attentionItems.find(
                          (old) => old.id === id,
                        ) ?? item)
                      : item,
                  ),
                }
              : stats,
        );
      toast.error(
        error.message || 'Could not save task. Your change was rolled back.',
      );
    },
    onSettled: () => {
      // Revalidate once after the last concurrent toggle, preserving other optimistic changes.
      if (client.isMutating({ mutationKey }) === 1) {
        for (const key of ['action-items', 'overview', 'meeting'])
          void client.invalidateQueries({ queryKey: [key, scope] });
      }
    },
  });
  return {
    pendingIds,
    toggle: (id: string, completed: boolean) => {
      if (!pendingIds.has(id)) mutation.mutate({ id, completed });
    },
  };
}
