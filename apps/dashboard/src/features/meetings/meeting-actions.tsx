import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  Pencil,
  Trash2,
  Loader2,
  MoreHorizontal,
  Share2,
  Download,
} from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Textarea,
  Skeleton,
  toast,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@meetflow/ui';
import {
  apiFetchMeeting,
  apiUpdateMeeting,
  apiDeleteMeeting,
} from './meetings-api';
import { ParticipantChips, type ParticipantInput } from './participant-chips';
import {
  invalidateMeetingData,
  meetingKey,
  workspaceScope,
} from './use-meetings';
import { ApiError } from '../../lib/api-client';
import type { MeetingItem } from '../../types/meeting';
import { downloadSummaryMarkdown } from '../meeting-detail/lib/export-utils';
import { getMeetingSummaryTemplates } from '../meeting-detail/lib/summary-templates';

export function MeetingActions({ meeting }: { meeting: MeetingItem }) {
  const client = useQueryClient();
  const [edit, setEdit] = React.useState(false);
  const [remove, setRemove] = React.useState(false);
  return (
    <div className="inline-flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit ${meeting.title}`}
        title="Edit meeting"
        onClick={() => setEdit(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${meeting.title}`}
        title="Delete meeting"
        className="text-muted-foreground hover:text-destructive"
        onClick={() => setRemove(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`More actions for ${meeting.title}`}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              void navigator.clipboard
                .writeText(`${window.location.origin}/meetings/${meeting.id}`)
                .then(() => toast.success('Meeting link copied'))
                .catch(() => toast.error('Could not copy the meeting link.'));
            }}
          >
            <Share2 className="mr-2 h-3.5 w-3.5" />
            Copy Link
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void client
                .fetchQuery({
                  queryKey: meetingKey(meeting.id),
                  queryFn: () => apiFetchMeeting(meeting.id),
                  staleTime: 30_000,
                })
                .then(({ meeting: detail }) => {
                  if (!detail.summary) {
                    toast.info('No summary is available yet.');
                    return;
                  }
                  downloadSummaryMarkdown(
                    detail,
                    getMeetingSummaryTemplates(detail).general,
                  );
                })
                .catch((error: unknown) =>
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : 'Unable to export notes.',
                  ),
                );
            }}
          >
            <Download className="mr-2 h-3.5 w-3.5" />
            Export Summary
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {edit && (
        <EditMeetingDialog meeting={meeting} onClose={() => setEdit(false)} />
      )}
      {remove && (
        <DeleteMeetingDialog
          meeting={meeting}
          onClose={() => setRemove(false)}
        />
      )}
    </div>
  );
}

function EditMeetingDialog({
  meeting,
  onClose,
}: {
  meeting: MeetingItem;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: meetingKey(meeting.id),
    queryFn: () => apiFetchMeeting(meeting.id),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const [title, setTitle] = React.useState(meeting.title);
  const [description, setDescription] = React.useState('');
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [participants, setParticipants] = React.useState<ParticipantInput[]>(
    [],
  );
  const [initialized, setInitialized] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!query.data || initialized) return;
    const raw = query.data.raw;
    const local = (date?: string | null) =>
      date
        ? new Date(
            new Date(date).getTime() -
              new Date(date).getTimezoneOffset() * 60_000,
          )
            .toISOString()
            .slice(0, 16)
        : '';
    setTitle(raw.title);
    setDescription(raw.description ?? '');
    setStart(local(raw.startAt));
    setEnd(local(raw.endAt));
    setParticipants(
      raw.participants.map((participant) => ({
        name: participant.name,
        email: participant.email || undefined,
        role: participant.role || undefined,
      })),
    );
    setInitialized(true);
  }, [query.data, initialized]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (end && new Date(end) <= new Date(start)) {
      setError('End time must be after start time.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await apiUpdateMeeting(meeting.id, {
        title: title.trim(),
        description: description.trim(),
        startAt: new Date(start).toISOString(),
        endAt: end ? new Date(end).toISOString() : null,
        participants,
      });
      for (const prefix of ['meetings', 'meeting-pages'])
        client.setQueriesData<{ meetings: MeetingItem[]; total: number }>(
          { queryKey: [prefix, workspaceScope()] },
          (data) =>
            data
              ? {
                  ...data,
                  meetings: data.meetings.map((item) =>
                    item.id === meeting.id
                      ? {
                          ...item,
                          title: result.title,
                          startDate: result.startAt,
                          participants: result.participants.map(
                            (participant) => ({
                              ...participant,
                              email: participant.email || '',
                              role: participant.role || undefined,
                            }),
                          ),
                        }
                      : item,
                  ),
                }
              : data,
        );
      onClose();
      toast.success('Meeting updated');
      void invalidateMeetingData(client);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Unable to save meeting.',
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent
        onEscapeKeyDown={(event) => {
          if (saving) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (saving) event.preventDefault();
        }}
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>Edit meeting</DialogTitle>
          <DialogDescription>
            Update this meeting’s details and participants.
          </DialogDescription>
        </DialogHeader>
        {query.isPending || (!initialized && !query.isError) ? (
          <div
            role="status"
            aria-label="Loading meeting editor"
            className="space-y-3"
          >
            <Skeleton className="h-9" />
            <Skeleton className="h-20" />
            <Skeleton className="h-12" />
          </div>
        ) : query.isError ? (
          <div role="alert" className="space-y-3">
            <p>{query.error.message}</p>
            <Button onClick={() => void query.refetch()}>Try Again</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" aria-busy={saving}>
            <div className="space-y-1">
              <label
                htmlFor="edit-meeting-title"
                className="text-xs font-medium"
              >
                Meeting title
              </label>
              <Input
                id="edit-meeting-title"
                required
                maxLength={255}
                value={title}
                disabled={saving}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-start" className="text-xs">
                  Start
                </label>
                <Input
                  id="edit-start"
                  type="datetime-local"
                  required
                  value={start}
                  disabled={saving}
                  onChange={(event) => setStart(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="edit-end" className="text-xs">
                  End (optional)
                </label>
                <Input
                  id="edit-end"
                  type="datetime-local"
                  value={end}
                  disabled={saving}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="edit-description" className="text-xs">
                Description
              </label>
              <Textarea
                id="edit-description"
                maxLength={2000}
                value={description}
                disabled={saving}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="edit-participants" className="text-xs">
                Participants
              </label>
              <ParticipantChips
                id="edit-participants"
                value={participants}
                disabled={saving}
                onChange={setParticipants}
              />
            </div>
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !title.trim()}>
                {saving && (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                )}
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteMeetingDialog({
  meeting,
  onClose,
}: {
  meeting: MeetingItem;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const cancel = React.useRef<HTMLButtonElement>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const remove = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      try {
        await apiDeleteMeeting(meeting.id);
      } catch (failure) {
        if (!(failure instanceof ApiError && failure.status === 404))
          throw failure;
      }
      for (const prefix of ['meetings', 'meeting-pages'])
        client.setQueriesData<{ meetings: MeetingItem[]; total: number }>(
          { queryKey: [prefix, workspaceScope()] },
          (data) =>
            data
              ? {
                  ...data,
                  total: Math.max(
                    0,
                    data.total -
                      (data.meetings.some((item) => item.id === meeting.id)
                        ? 1
                        : 0),
                  ),
                  meetings: data.meetings.filter(
                    (item) => item.id !== meeting.id,
                  ),
                }
              : data,
        );
      client.removeQueries({ queryKey: meetingKey(meeting.id) });
      if (window.location.pathname === `/meetings/${meeting.id}`)
        await navigate({ to: '/' });
      onClose();
      toast.success('Meeting deleted');
      void invalidateMeetingData(client);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Unable to delete meeting.',
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent
        role="alertdialog"
        aria-busy={pending}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancel.current?.focus();
        }}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Delete meeting?</DialogTitle>
          <DialogDescription>
            This permanently removes “{meeting.title}”, its recording,
            transcript, summary, and action items from this workspace. This
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            ref={cancel}
            variant="outline"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => void remove()}
          >
            {pending ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="mr-1 h-3.5 w-3.5" />
            )}
            {pending ? 'Deleting…' : 'Delete Meeting'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
