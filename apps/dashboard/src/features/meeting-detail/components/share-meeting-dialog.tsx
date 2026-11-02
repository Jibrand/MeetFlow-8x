import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Checkbox,
  toast,
} from '@meetflow/ui';
import type { MeetingItem } from '../../../types/meeting';
import { apiClient } from '../../../lib/api-client';
import { workspaceScope } from '../../meetings/use-meetings';
interface Permissions {
  allowSummary: boolean;
  allowHighlights: boolean;
  allowActions: boolean;
  allowTranscript: boolean;
}
interface Sharing {
  token: string;
  enabled: boolean;
  permissions: Permissions;
}
const defaults: Permissions = {
  allowSummary: true,
  allowHighlights: true,
  allowActions: true,
  allowTranscript: false,
};
export function ShareMeetingDialog({
  open,
  onOpenChange,
  meeting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: MeetingItem;
  currentTimestamp?: number;
}) {
  const client = useQueryClient();
  const key = ['sharing', workspaceScope(), meeting.id];
  const query = useQuery({
    queryKey: key,
    enabled: open,
    queryFn: () => apiClient<Sharing | null>(`/meetings/${meeting.id}/sharing`),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [permissions, setPermissions] = React.useState(defaults);
  React.useEffect(() => {
    if (query.data) setPermissions(query.data.permissions);
  }, [query.data]);
  const act = async (action: string) => {
    setPending(true);
    setError(null);
    try {
      const result = await apiClient<Sharing | null>(
        `/meetings/${meeting.id}/sharing`,
        { method: 'POST', body: JSON.stringify({ action, permissions }) },
      );
      client.setQueryData(key, result);
      toast.success(
        action === 'revoke' ? 'Share link revoked' : 'Sharing updated',
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Could not update sharing.',
      );
    } finally {
      setPending(false);
    }
  };
  const url = query.data
    ? `${window.location.origin}/share/${query.data.token}`
    : '';
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share meeting</DialogTitle>
          <DialogDescription>
            An enabled link shows only the sections you allow. Admin sign-in is
            required. Transcript sharing is off by default.
          </DialogDescription>
        </DialogHeader>
        {query.isPending ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading sharing…
          </p>
        ) : query.isError ? (
          <div role="alert">
            <p>{query.error.message}</p>
            <Button onClick={() => void query.refetch()}>Retry</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Link access is {query.data?.enabled ? 'enabled' : 'disabled'}.
              Regenerating or revoking invalidates the previous link.
            </p>
            <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2">
              <legend className="mb-2 text-xs font-medium">
                Visible sections
              </legend>
              {Object.entries({
                allowSummary: 'AI summary',
                allowHighlights: 'Highlights',
                allowActions: 'Action items',
                allowTranscript: 'Transcript',
              }).map(([name, label]) => (
                <label key={name} className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={permissions[name as keyof Permissions]}
                    onCheckedChange={(value) =>
                      setPermissions((old) => ({
                        ...old,
                        [name]: Boolean(value),
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            {url && (
              <div className="flex gap-2">
                <Input
                  aria-label="Meeting share link"
                  readOnly
                  value={url}
                  onFocus={(event) => event.target.select()}
                />
                <Button
                  disabled={pending || !query.data?.enabled}
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(url)
                      .then(() => toast.success('Meeting link copied'))
                      .catch(() => toast.error('Could not copy link.'));
                  }}
                >
                  Copy link
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={pending}
                onClick={() =>
                  void act(query.data?.enabled ? 'disable' : 'enable')
                }
              >
                {pending
                  ? 'Updating…'
                  : query.data?.enabled
                    ? 'Disable sharing'
                    : 'Enable sharing'}
              </Button>
              {query.data && (
                <>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() => void act('update')}
                  >
                    Save permissions
                  </Button>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() => void act('regenerate')}
                  >
                    Regenerate link
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={pending}
                    onClick={() => void act('revoke')}
                  >
                    Revoke link
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
