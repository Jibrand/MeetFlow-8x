import * as React from 'react';
import { apiFetchProcessingStatus, ProcessingStatusResponse } from '../../meetings/meetings-api';

export interface UseProcessingPollOptions {
  meetingId: string;
  enabled?: boolean;
  onReady?: () => void;
  onFailed?: (errorCode?: string | null) => void;
}

export function useProcessingPoll({
  meetingId,
  enabled = true,
  onReady,
  onFailed,
}: UseProcessingPollOptions) {
  const [data, setData] = React.useState<ProcessingStatusResponse | null>(null);
  const [isPolling, setIsPolling] = React.useState(enabled);
  const [error, setError] = React.useState<string | null>(null);

  const onReadyRef = React.useRef(onReady);
  const onFailedRef = React.useRef(onFailed);
  onReadyRef.current = onReady;
  onFailedRef.current = onFailed;

  React.useEffect(() => {
    setData(null);
    setError(null);
    if (!enabled || !meetingId) {
      setIsPolling(false);
      return;
    }

    let isMounted = true;
    let timerId: NodeJS.Timeout | null = null;

    const poll = async () => {
      try {
        const res = await apiFetchProcessingStatus(meetingId);
        if (!isMounted) return;

        setData(res);
        setError(null);

        if (res.processingStatus === 'READY') {
          setIsPolling(false);
          onReadyRef.current?.();
          return;
        }

        if (res.processingStatus === 'FAILED') {
          setIsPolling(false);
          onFailedRef.current?.(res.errorCode);
          return;
        }

        // Continue polling every 2.5 seconds
        timerId = setTimeout(poll, 2500);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to poll processing status');
        // Retry polling on transient network hiccup
        timerId = setTimeout(poll, 4000);
      }
    };

    setIsPolling(true);
    poll();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [meetingId, enabled]);

  return {
    stage: data?.stage || 'QUEUED',
    progress: data?.progress || 0,
    processingStatus: data?.processingStatus,
    errorCode: data?.errorCode,
    isPolling,
    error,
  };
}
