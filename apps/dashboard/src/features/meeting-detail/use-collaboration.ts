import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { workspaceScope } from '../meetings/use-meetings';
import type {
  HighlightData,
  SummaryTemplateContent,
  SummaryTemplateId,
} from '../../types/meeting';
export function useHighlights(meetingId: string) {
  const client = useQueryClient();
  const key = ['highlights', workspaceScope(), meetingId];
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      apiClient<HighlightData[]>(`/meetings/${meetingId}/highlights`, {
        signal,
      }),
    staleTime: 30_000,
    retry: false,
  });
  const save = async (data: Omit<HighlightData, 'id'>, id?: string) => {
    await client.cancelQueries({ queryKey: key });
    const previous = client.getQueryData<HighlightData[]>(key) ?? [];
    const tempId = id ?? `pending-${crypto.randomUUID()}`;
    client.setQueryData<HighlightData[]>(key, (old = []) =>
      id
        ? old.map((item) => (item.id === id ? { ...item, ...data } : item))
        : [...old, { ...data, id: tempId }],
    );
    try {
      const saved = await apiClient<HighlightData>(
        `/meetings/${meetingId}/highlights${id ? `/${id}` : ''}`,
        {
          method: id ? 'PATCH' : 'POST',
          body: JSON.stringify({
            label: data.label,
            quote: data.quote ?? '',
            tag: data.tag,
            startTime: data.hasTimestamp === false ? null : data.startTime,
          }),
        },
      );
      client.setQueryData<HighlightData[]>(key, (old = []) =>
        old.map((item) => (item.id === tempId ? saved : item)),
      );
    } catch (error) {
      client.setQueryData<HighlightData[]>(key, (old = []) =>
        id
          ? old.map((item) =>
              item.id === id
                ? (previous.find((p) => p.id === id) ?? item)
                : item,
            )
          : old.filter((item) => item.id !== tempId),
      );
      throw error;
    } finally {
      void client.invalidateQueries({ queryKey: key });
    }
  };
  const remove = async (id: string) => {
    await client.cancelQueries({ queryKey: key });
    const previous = client
      .getQueryData<HighlightData[]>(key)
      ?.find((item) => item.id === id);
    client.setQueryData<HighlightData[]>(key, (old = []) =>
      old.filter((item) => item.id !== id),
    );
    try {
      await apiClient(`/meetings/${meetingId}/highlights/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      if (previous)
        client.setQueryData<HighlightData[]>(key, (old = []) => [
          ...old.filter((item) => item.id !== id),
          previous,
        ]);
      throw error;
    } finally {
      void client.invalidateQueries({ queryKey: key });
    }
  };
  return { ...query, save, remove };
}
interface Variant {
  status: string;
  content: SummaryTemplateContent | null;
  error?: string | null;
}
export function useSummaryVariant(
  meetingId: string,
  type: SummaryTemplateId,
  enabled: boolean,
) {
  const client = useQueryClient();
  const key = ['summary-variant', workspaceScope(), meetingId, type];
  const query = useQuery({
    queryKey: key,
    enabled: enabled && type !== 'general',
    queryFn: async ({ signal }) => {
      const result = await apiClient<Variant>(
        `/meetings/${meetingId}/summaries/${type}`,
        { signal },
      );
      return result.status === 'NOT_GENERATED'
        ? apiClient<Variant>(`/meetings/${meetingId}/summaries/${type}`, {
            method: 'POST',
            body: JSON.stringify({}),
          })
        : result;
    },
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchInterval: (query) =>
      ['QUEUED', 'RUNNING'].includes(query.state.data?.status ?? '')
        ? 2500
        : false,
  });
  const retry = async () => {
    const result = await apiClient<Variant>(
      `/meetings/${meetingId}/summaries/${type}`,
      { method: 'POST', body: JSON.stringify({ retry: true }) },
    );
    client.setQueryData(key, result);
  };
  return { ...query, retry };
}
