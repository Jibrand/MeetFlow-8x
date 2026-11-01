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
  toast,
} from '@meetflow/ui';
import {
  CheckCircle2,
  MoreHorizontal,
  Bell,
  Search,
} from 'lucide-react';

export const designRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/design',
  component: DesignSystemPage,
});

function DesignSystemPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [checked, setChecked] = React.useState(true);

  return (
    <TooltipProvider>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Design System & Component Gallery</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Internal showcase of shared design tokens, interactive controls, and density standards.
          </p>
        </div>

        {/* 1. Color Tokens Showcase */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">1. Semantic Color Tokens</h2>
            <Badge variant="outline">Light / Dark Reactive</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
            <div className="p-3 rounded-md border bg-background text-foreground space-y-1 shadow-xs">
              <div className="font-medium">Background</div>
              <div className="text-[10px] text-muted-foreground">Default canvas</div>
            </div>
            <div className="p-3 rounded-md border bg-card text-card-foreground space-y-1 shadow-xs">
              <div className="font-medium">Card Surface</div>
              <div className="text-[10px] text-muted-foreground">Elevated content</div>
            </div>
            <div className="p-3 rounded-md bg-primary text-primary-foreground space-y-1 shadow-xs">
              <div className="font-medium">Primary Accent</div>
              <div className="text-[10px] opacity-80">Brand interactive</div>
            </div>
            <div className="p-3 rounded-md bg-secondary text-secondary-foreground space-y-1 shadow-xs">
              <div className="font-medium">Secondary</div>
              <div className="text-[10px] text-muted-foreground">Subtle surfaces</div>
            </div>
            <div className="p-3 rounded-md bg-muted text-muted-foreground space-y-1 shadow-xs">
              <div className="font-medium">Muted</div>
              <div className="text-[10px] opacity-80">Inactive elements</div>
            </div>
            <div className="p-3 rounded-md bg-destructive text-destructive-foreground space-y-1 shadow-xs">
              <div className="font-medium">Destructive</div>
              <div className="text-[10px] opacity-80">Critical actions</div>
            </div>
          </div>
        </section>

        <Separator />

        {/* 2. Buttons & Variants */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">2. Buttons & Sizes</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button size="sm">Small (28px)</Button>
            <Button size="icon" variant="outline" title="Settings">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <Separator />

        {/* 3. Badges */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">3. Badges & Indicators</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Completed</Badge>
            <Badge variant="warning">In Review</Badge>
            <Badge variant="destructive">Failed</Badge>
          </div>
        </section>

        <Separator />

        {/* 4. Form Controls */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">4. Form Controls & Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Text Input</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search meetings, transcripts, action items..." className="pl-8" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Textarea</label>
              <Textarea placeholder="Type meeting notes or AI query here..." />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={checked}
                onCheckedChange={(val) => setChecked(Boolean(val))}
              />
              <label
                htmlFor="terms"
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Auto-generate action items from transcript
              </label>
            </div>
          </div>
        </section>

        <Separator />

        {/* 5. Interactive Overlays & Modals */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">5. Overlays, Dialogs & Dropdowns</h2>
          <div className="flex flex-wrap items-center gap-3">
            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Open Dialog Modal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Meeting Recording</DialogTitle>
                  <DialogDescription>
                    Anyone with this link will be able to review the transcript and summary notes.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Input readOnly value="https://meetflow.ai/share/sample-token-1234" />
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                    Close
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
                  Options Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Meeting Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast.info('Exporting summary as PDF...')}>
                  Export Summary (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info('Regenerating transcript...')}>
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

            {/* Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <Bell className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>3 pending action items assigned to you</span>
              </TooltipContent>
            </Tooltip>

            {/* Toast Triggers */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.success('Action item assigned successfully!')}
            >
              Trigger Success Toast
            </Button>
          </div>
        </section>

        <Separator />

        {/* 6. Tabs & Content Views */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">6. Tabs & Content Views</h2>
          <Tabs defaultValue="summary" className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
              <TabsTrigger value="actions">Action Items</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="p-3 border rounded-md text-xs space-y-1">
              <div className="font-semibold">Executive Overview</div>
              <p className="text-muted-foreground">
                The product team aligned on shipping Phase 01 engineering foundation before proceeding to UI workflows.
              </p>
            </TabsContent>
            <TabsContent value="transcript" className="p-3 border rounded-md text-xs space-y-1">
              <div className="font-semibold">00:00 — Jibran (Product Engineer)</div>
              <p className="text-muted-foreground">
                Let's review the assignment requirements and verify capture before building anything.
              </p>
            </TabsContent>
            <TabsContent value="actions" className="p-3 border rounded-md text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Verify agent capture system</span>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <Separator />

        {/* 7. Card & Skeletons */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">7. Cards & Skeletons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-xs">Meeting Intelligence Summary</CardTitle>
                <CardDescription className="text-2xs">Live metrics and processing status</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                Components adhere to 100% desktop density with restrained shadows and borders.
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}
