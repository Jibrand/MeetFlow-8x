import * as React from 'react';
import {
  Button,
  Input,
  Textarea,
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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Separator,
  toast,
} from '@meetflow/ui';
import { Search, MoreHorizontal, Bell } from 'lucide-react';

export function ControlsShowcase() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [checkboxState, setCheckboxState] = React.useState(true);
  const [switchState, setSwitchState] = React.useState(true);
  const [radioState, setRadioState] = React.useState('executive');

  return (
    <section className="space-y-6">
      {/* 4. Form Controls */}
      <div className="space-y-4">
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
      </div>

      <Separator />

      {/* 5. Buttons & Modals */}
      <div className="space-y-4">
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
      </div>
    </section>
  );
}
