import * as React from 'react';
import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import {
  Button,
  Input,
  Textarea,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Checkbox,
  Switch,
  RadioGroup,
  RadioGroupItem,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Skeleton,
  Separator,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  MeetingStatusBadge,
  SpeakerAvatar,
  TimestampLink,
  MeetingMetadata,
  ActionItemRow,
  TranscriptTurn,
  HighlightChip,
  toast,
} from '@meetflow/ui';
import {
  CheckCircle2,
  MoreHorizontal,
  Bell,
  Search,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { useTheme } from '../providers/theme-provider';

export const designRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/design',
  component: DesignSystemPage,
});

function DesignSystemPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [checkboxState, setCheckboxState] = React.useState(true);
  const [switchState, setSwitchState] = React.useState(true);
  const [radioState, setRadioState] = React.useState('executive');
  const [actionDone, setActionDone] = React.useState(false);
  const [activeTurn, setActiveTurn] = React.useState(1);
  const { theme, setTheme } = useTheme();

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {/* Header & Theme Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              <span>Phase 02 — Design System & Component Library</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Design System Showcase
            </h1>
            <p className="text-xs text-muted-foreground">
              Component standards, semantic design tokens, and meeting intelligence primitives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
            >
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
            >
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
            >
              System
            </Button>
          </div>
        </div>

        {/* 1. Typography Standards */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">1. Typography Scale (100% Zoom)</h2>
            <p className="text-xs text-muted-foreground">Calibrated for Linear-density productivity software.</p>
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-baseline justify-between border-b pb-2">
              <span className="text-display">Display 28px</span>
              <span className="text-[10px] text-muted-foreground font-mono">.text-display (28/34)</span>
            </div>
            <div className="flex items-baseline justify-between border-b pb-2">
              <span className="text-h1">Heading 1 — 22px</span>
              <span className="text-[10px] text-muted-foreground font-mono">.text-h1 (22/28)</span>
            </div>
            <div className="flex items-baseline justify-between border-b pb-2">
              <span className="text-h2">Heading 2 — 18px</span>
              <span className="text-[10px] text-muted-foreground font-mono">.text-h2 (18/24)</span>
            </div>
            <div className="flex items-baseline justify-between border-b pb-2">
              <span className="text-h3">Heading 3 — 15px</span>
              <span className="text-[10px] text-muted-foreground font-mono">.text-h3 (15/22)</span>
            </div>
            <div className="flex items-baseline justify-between border-b pb-2">
              <span className="text-body">Body default — 13px readable text across transcripts and summaries</span>
              <span className="text-[10px] text-muted-foreground font-mono">.text-body (13/20)</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-label text-muted-foreground">Section Label</span>
              <span className="text-[10px] text-muted-foreground font-mono">.text-label (10px uppercase)</span>
            </div>
          </div>
        </section>

        <Separator />

        {/* 2. Color Tokens */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">2. Semantic Surface & Accent Tokens</h2>
              <p className="text-xs text-muted-foreground">Theme-reactive neutrals with single restrained accent.</p>
            </div>
            <Badge variant="outline">HSL Reactive</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
            <div className="p-3 rounded-md border bg-background text-foreground space-y-1 shadow-2xs">
              <div className="font-semibold">Canvas</div>
              <div className="text-[10px] text-muted-foreground">bg-background</div>
            </div>
            <div className="p-3 rounded-md border bg-card text-card-foreground space-y-1 shadow-2xs">
              <div className="font-semibold">Card Surface</div>
              <div className="text-[10px] text-muted-foreground">bg-card</div>
            </div>
            <div className="p-3 rounded-md bg-primary text-primary-foreground space-y-1 shadow-2xs">
              <div className="font-semibold">Accent Blue</div>
              <div className="text-[10px] opacity-80">bg-primary</div>
            </div>
            <div className="p-3 rounded-md bg-secondary text-secondary-foreground space-y-1 shadow-2xs">
              <div className="font-semibold">Secondary</div>
              <div className="text-[10px] text-muted-foreground">bg-secondary</div>
            </div>
            <div className="p-3 rounded-md bg-muted text-muted-foreground space-y-1 shadow-2xs">
              <div className="font-semibold">Muted</div>
              <div className="text-[10px] opacity-80">bg-muted</div>
            </div>
            <div className="p-3 rounded-md bg-destructive text-destructive-foreground space-y-1 shadow-2xs">
              <div className="font-semibold">Destructive</div>
              <div className="text-[10px] opacity-80">bg-destructive</div>
            </div>
          </div>
        </section>

        <Separator />

        {/* 3. Meeting-Specific Primitives */}
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

            {/* Interactive Workspace Tabs (Transcript, Actions, Summary) */}
            <div className="space-y-2">
              <span className="text-label text-muted-foreground">Meeting Workspace Tabs (Interactive)</span>
              <Tabs defaultValue="transcript" className="w-full">
                <TabsList className="grid w-full max-w-sm grid-cols-3">
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  <TabsTrigger value="actions">Action Items</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>

                {/* Tab: Transcript */}
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

                {/* Tab: Action Items */}
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

                {/* Tab: Summary */}
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

        <Separator />

        {/* 4. Form Controls & Interactive Toggles */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">4. Form Controls & Toggles</h2>
            <p className="text-xs text-muted-foreground">Inputs, textareas, accessible switches, checkboxes, and radio options.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Search Input</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Filter recordings, transcripts, summaries..." className="pl-8" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Meeting Notes (Textarea)</label>
                <Textarea placeholder="Type meeting notes or AI query here..." />
              </div>
            </div>

            <div className="space-y-4 rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium">Auto-generate AI Action Items</span>
                  <p className="text-[11px] text-muted-foreground">Extract decisions and tasks immediately after call ends.</p>
                </div>
                <Switch checked={switchState} onCheckedChange={setSwitchState} />
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <Checkbox
                  id="notif"
                  checked={checkboxState}
                  onCheckedChange={(val) => setCheckboxState(Boolean(val))}
                />
                <label htmlFor="notif" className="text-xs font-medium leading-none cursor-pointer">
                  Email participant summaries when processing completes
                </label>
              </div>

              <Separator />

              <div className="space-y-2">
                <span className="text-xs font-medium">Summary Template Lens</span>
                <RadioGroup value={radioState} onValueChange={setRadioState} className="grid grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/30 cursor-pointer">
                    <RadioGroupItem value="executive" id="r1" />
                    <label htmlFor="r1" className="text-xs cursor-pointer">Executive</label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/30 cursor-pointer">
                    <RadioGroupItem value="sales" id="r2" />
                    <label htmlFor="r2" className="text-xs cursor-pointer">Sales</label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/30 cursor-pointer">
                    <RadioGroupItem value="tech" id="r3" />
                    <label htmlFor="r3" className="text-xs cursor-pointer">Engineering</label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* 5. Buttons, Overlays, and Notifications */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">5. Buttons, Modals & Notifications</h2>
            <p className="text-xs text-muted-foreground">Accessible Radix modals, dropdowns, and Sonner notifications.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="default">Primary Action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button size="sm">Small 28px</Button>
            <Button disabled>Disabled</Button>

            {/* Dialog Trigger */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Open Share Dialog
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Meeting Recording</DialogTitle>
                  <DialogDescription>
                    Anyone with this public link can watch recording playback and view AI summaries.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                  <Input readOnly value="https://meetflow.ai/share/pub_09b823" />
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setDialogOpen(false);
                      toast.success('Share link copied to clipboard!');
                    }}
                  >
                    Copy Link
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  <span>Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Meeting Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.info('Exporting summary...')}>
                  Export Summary (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info('Re-running AI transcription...')}>
                  Regenerate Transcript
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => toast.error('Meeting deleted')}
                >
                  Delete Recording
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tooltip Trigger */}
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <Bell className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>3 pending action items</span>
              </TooltipContent>
            </Tooltip>

            {/* Toast Trigger */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.success('Meeting summary regenerated!')}
            >
              Trigger Toast
            </Button>
          </div>
        </section>

        <Separator />

        {/* 6. High-Density Table */}
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

        <Separator />

        {/* 7. Loading, Empty, and Error States */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">7. Loading, Empty & Error States</h2>
            <p className="text-xs text-muted-foreground">Standardized feedback patterns for empty views and network errors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Loading Indicator */}
            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <LoadingIndicator label="Transcribing audio..." />
              <div className="mt-4 w-full space-y-2">
                <Skeleton className="h-3 w-3/4 mx-auto" />
                <Skeleton className="h-3 w-1/2 mx-auto" />
              </div>
            </Card>

            {/* Empty State */}
            <EmptyState
              icon={<Inbox className="h-5 w-5" />}
              title="No upcoming calls"
              description="Connect your calendar or upload an audio file to generate intelligence."
              actionLabel="Add Recording"
              onAction={() => toast.info('Recording modal triggered')}
            />

            {/* Error State */}
            <ErrorState
              title="Transcription error"
              message="The audio stream could not be decoded. Please retry."
              onRetry={() => toast.info('Retrying connection...')}
            />
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}
