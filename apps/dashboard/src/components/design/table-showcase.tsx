import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  MeetingStatusBadge,
  SpeakerAvatar,
  MeetingMetadata,
  Button,
} from '@meetflow/ui';

export function TableShowcase() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">6. Compact Meeting Table</h2>
        <p className="text-xs text-muted-foreground">Linear-inspired data density with 36px row heights.</p>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meeting</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date & Duration</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium text-foreground">
                Product Roadmap & AI Alignment
              </TableCell>
              <TableCell>
                <MeetingStatusBadge status="ready" />
              </TableCell>
              <TableCell>
                <MeetingMetadata date="2026-11-01" durationSeconds={2700} compact />
              </TableCell>
              <TableCell>
                <div className="flex items-center -space-x-1.5">
                  <SpeakerAvatar name="Jibran" size="xs" />
                  <SpeakerAvatar name="Sarah Connor" size="xs" />
                  <SpeakerAvatar name="Alex Vance" size="xs" />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-foreground">
                Engineering Sprint Planning (Q4)
              </TableCell>
              <TableCell>
                <MeetingStatusBadge status="processing" />
              </TableCell>
              <TableCell>
                <MeetingMetadata date="2026-11-01" durationSeconds={1800} compact />
              </TableCell>
              <TableCell>
                <div className="flex items-center -space-x-1.5">
                  <SpeakerAvatar name="Jibran" size="xs" />
                  <SpeakerAvatar name="Elena Fisher" size="xs" />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
