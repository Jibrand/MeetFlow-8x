import * as React from 'react';
import {
  MeetingStatusBadge,
  SpeakerAvatar,
  TimestampLink,
  MeetingMetadata,
  ActionItemRow,
  TranscriptTurn,
  HighlightChip,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  toast,
} from '@meetflow/ui';
import { CheckCircle2 } from 'lucide-react';

export function MeetingShowcase() {
  const [actionDone, setActionDone] = React.useState(false);
  const [activeTurn, setActiveTurn] = React.useState(1);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">3. Meeting-Specific Primitives</h2>
        <p className="text-xs text-muted-foreground">Domain components designed specifically for meeting intelligence workflows.</p>
      </div>

      <div className="space-y-4">
        {/* Badges & Avatars */}
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg border bg-card">
          <div className="space-y-1">
            <span className="text-label text-muted-foreground">Status Badges</span>
            <div className="flex items-center gap-2">
              <MeetingStatusBadge status="ready" />
              <MeetingStatusBadge status="processing" />
              <MeetingStatusBadge status="scheduled" />
              <MeetingStatusBadge status="failed" />
            </div>
          </div>

          <div className="h-8 w-[1px] bg-border mx-2" />

          <div className="space-y-1">
            <span className="text-label text-muted-foreground">Speaker Avatars</span>
            <div className="flex items-center gap-1.5">
              <SpeakerAvatar name="Jibran" size="default" />
              <SpeakerAvatar name="Sarah Connor" size="default" />
              <SpeakerAvatar name="Alex Vance" size="default" />
              <SpeakerAvatar name="Elena Fisher" size="default" />
            </div>
          </div>

          <div className="h-8 w-[1px] bg-border mx-2" />

          <div className="space-y-1">
            <span className="text-label text-muted-foreground">Timestamps</span>
            <div className="flex items-center gap-2">
              <TimestampLink seconds={45} onSeek={(s) => toast.info(`Seek to ${s}s`)} />
              <TimestampLink seconds={184} showPlayIcon onSeek={(s) => toast.info(`Seek to ${s}s`)} />
              <TimestampLink seconds={3692} onSeek={(s) => toast.info(`Seek to ${s}s`)} />
            </div>
          </div>
        </div>

        {/* Metadata & Highlight Chips */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border bg-card">
          <div className="space-y-1">
            <span className="text-label text-muted-foreground">Meeting Metadata</span>
            <div>
              <MeetingMetadata
                date={new Date('2026-11-01T15:30:00Z')}
                durationSeconds={2700}
                attendeeCount={5}
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-label text-muted-foreground">Highlight Chips</span>
            <div className="flex flex-wrap items-center gap-2">
              <HighlightChip
                label="Pricing Approved"
                tag="Decision"
                timestampSeconds={124}
                onSeek={(s) => toast.info(`Seek to ${s}s`)}
                onRemove={() => toast.success('Bookmark removed')}
              />
              <HighlightChip
                label="Release Schedule"
                tag="Key Moment"
                timestampSeconds={480}
                onSeek={(s) => toast.info(`Seek to ${s}s`)}
              />
            </div>
          </div>
        </div>

        {/* Interactive Workspace Tabs */}
        <div className="space-y-2">
          <span className="text-label text-muted-foreground">Meeting Workspace Tabs (Interactive)</span>
          <Tabs defaultValue="transcript" className="w-full">
            <TabsList className="grid w-full max-w-sm grid-cols-3">
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="actions">Action Items</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="space-y-2 pt-2">
              <div className="space-y-2 rounded-lg border bg-card p-3">
                <TranscriptTurn
                  speakerName="Jibran"
                  startTime={12}
                  text="Welcome everyone. Today we are establishing the frontend design system and layout shell for MeetFlow AI."
                  isActive={activeTurn === 1}
                  onClick={() => setActiveTurn(1)}
                  onSeek={(s) => toast.info(`Scrubbing to ${s}s`)}
                />
                <TranscriptTurn
                  speakerName="Sarah Connor"
                  startTime={45}
                  text="The component density looks very sharp. The 32px navigation rows and 13px body text keep information dense without feeling cluttered."
                  isActive={activeTurn === 2}
                  onClick={() => setActiveTurn(2)}
                  onSeek={(s) => toast.info(`Scrubbing to ${s}s`)}
                />
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-2 pt-2">
              <div className="space-y-2">
                <ActionItemRow
                  title="Finalize transcript playback seek offset sync algorithm"
                  completed={actionDone}
                  onToggleCompleted={setActionDone}
                  assigneeName="Jibran"
                  dueDate="2026-11-04"
                  priority="high"
                  timestampSeconds={215}
                  onSeek={(s) => toast.info(`Seek to ${s}s`)}
                />
                <ActionItemRow
                  title="Prepare Neon database schema migrations for multi-speaker transcripts"
                  completed={true}
                  assigneeName="Sarah Connor"
                  dueDate="2026-11-02"
                  priority="medium"
                  timestampSeconds={840}
                  onSeek={(s) => toast.info(`Seek to ${s}s`)}
                />
              </div>
            </TabsContent>

            <TabsContent value="summary" className="pt-2">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Executive Summary Lens</span>
                  </div>
                  <CardTitle className="text-sm mt-1">Sprint Kickoff & Architecture Alignment</CardTitle>
                  <CardDescription className="text-xs">
                    Generated by MeetFlow Intelligence from 45 minutes of audio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-1 text-xs text-muted-foreground space-y-1.5">
                  <p>
                    The product engineering team aligned on the 100% desktop zoom density standards, collapsible sidebar layout, and verified 8x prompt capture infrastructure.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
