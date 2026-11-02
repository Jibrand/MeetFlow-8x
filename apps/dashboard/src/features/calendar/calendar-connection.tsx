import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { Badge, Button, toast } from '@meetflow/ui';
import { apiClient } from '../../lib/api-client';

export function CalendarConnection() {
  const client = useQueryClient();
  const [busy, setBusy] = React.useState(false);
  const status = useQuery({ queryKey: ['calendar-connection'], queryFn: () => apiClient<{ configured: boolean; connected: boolean; lastSyncedAt?: string; syncing: boolean; error?: string }>('/integrations/calendar'), retry: false, refetchInterval: 30_000, gcTime: 0 });
  const act = async (action: 'authorize' | 'sync' | 'disconnect') => {
    setBusy(true);
    try {
      const result = await apiClient<{ url?: string; busy?: boolean }>(`/integrations/calendar/${action}`, { method: 'POST', body: '{}', timeoutMs: 330_000 });
      if (action === 'authorize' && result.url) { window.location.assign(result.url); return; }
      toast.success(action === 'disconnect' ? 'Calendar disconnected. Imported meetings are retained.' : result.busy ? 'Synchronization is already running.' : 'Calendar synchronized.');
      await client.invalidateQueries({ queryKey: ['calendar-connection'] });
      await client.invalidateQueries({ queryKey: ['meetings'] });
      await client.invalidateQueries({ queryKey: ['overview'] });
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Calendar connection failed.'); }
    finally { setBusy(false); }
  };
  React.useEffect(() => {
    const result = new URLSearchParams(window.location.search).get('calendar');
    if (!result) return;
    if (result === 'connected') { toast.success('Google Calendar connected. Syncing upcoming meetings…'); void act('sync'); }
    else toast.error(result === 'denied' ? 'Calendar access was not granted.' : 'Calendar connection could not finish. Please reconnect.');
    const url = new URL(window.location.href); url.searchParams.delete('calendar'); window.history.replaceState({}, '', url);
    // Process the OAuth result once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-primary" /><div><p className="text-xs font-semibold">Google Calendar <Badge variant="outline" className="ml-1 text-[10px]">{status.isPending ? 'Loading…' : status.data?.connected ? 'Connected' : 'Disconnected'}</Badge></p><p className="text-[11px] text-muted-foreground">Read-only synchronization of your primary calendar into this workspace.</p></div></div>
      <div className="flex gap-2">{status.data?.connected ? <><Button variant="outline" size="sm" disabled={busy || status.data.syncing} onClick={() => void act('sync')}>Sync Now</Button><Button variant="outline" size="sm" disabled={busy} onClick={() => void act('disconnect')}>Disconnect</Button></> : <Button variant="outline" size="sm" disabled={busy || !status.data?.configured} onClick={() => void act('authorize')}>Connect</Button>}</div>
    </div>
    {status.data?.lastSyncedAt && <p className="text-[11px] text-muted-foreground">Last synchronized {new Date(status.data.lastSyncedAt).toLocaleString()}</p>}
    {status.data && !status.data.configured && <p className="text-xs text-muted-foreground">Calendar connection setup is needed on the server before you can connect.</p>}
    {(status.error || status.data?.error) && <p role="alert" className="text-xs text-destructive">{status.error?.message || status.data?.error}</p>}
  </div>;
}
