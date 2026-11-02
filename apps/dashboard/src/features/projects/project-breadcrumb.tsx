import * as React from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@meetflow/ui';
import { apiClient } from '../../lib/api-client';
import type { MeetingItem } from '../../types/meeting';
import {
  ProjectPicker,
  setProjectContext,
  useExecutionInvalidation,
} from './project-context';
export function ProjectBreadcrumb({ meeting }: { meeting: MeetingItem }) {
  const [open, setOpen] = React.useState(false);
  const [selection, setSelection] = React.useState({
    companyId: meeting.project?.companyId,
    projectId: meeting.projectId,
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const invalidate = useExecutionInvalidation();
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {meeting.project?.company.name} / {meeting.project?.name}
          {meeting.project?.needsReview ? ' · Needs project assignment' : ''}
        </span>
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          Change project
        </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign meeting project</DialogTitle>
            <DialogDescription>
              Choose the correct company and project. Meetings with
              cross-meeting history keep their project to preserve audit links.
            </DialogDescription>
          </DialogHeader>
          <ProjectPicker required value={selection} onChange={setSelection} />
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={busy || !selection.projectId || !selection.companyId}
              onClick={() => {
                setBusy(true);
                setError(null);
                void apiClient(`/meetings/${meeting.id}/project`, {
                  method: 'POST',
                  body: JSON.stringify(selection),
                })
                  .then(() => {
                    setProjectContext(
                      selection.companyId!,
                      selection.projectId!,
                    );
                    invalidate();
                    setOpen(false);
                  })
                  .catch((e: Error) => setError(e.message))
                  .finally(() => setBusy(false));
              }}
            >
              {busy ? 'Saving…' : 'Assign project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
