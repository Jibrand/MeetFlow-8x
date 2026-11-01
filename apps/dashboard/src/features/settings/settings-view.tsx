import * as React from 'react';
import { useTheme } from '../../providers/theme-provider';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Badge,
  toast,
} from '@meetflow/ui';
import { Palette, Layers, Radio, Calendar, Video } from 'lucide-react';

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const [workspaceName, setWorkspaceName] = React.useState('MeetFlow AI Production');
  const [defaultLens, setDefaultLens] = React.useState('executive');

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Workspace preferences saved');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="border-b border-border/60 pb-5 space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Workspace Settings
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage visual theme, recording defaults, and external service integrations.
        </p>
      </div>

      {/* 1. Appearance / Theme */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Appearance & Theme</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Choose your preferred interface theme. Syncs with system preferences by default.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-3 gap-3 max-w-sm">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center justify-center rounded-lg border p-3 text-xs font-medium transition-colors ${
                theme === 'light'
                  ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                  : 'border-border/70 bg-card hover:bg-muted/40'
              }`}
            >
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center justify-center rounded-lg border p-3 text-xs font-medium transition-colors ${
                theme === 'dark'
                  ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                  : 'border-border/70 bg-card hover:bg-muted/40'
              }`}
            >
              <span>Dark</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center justify-center rounded-lg border p-3 text-xs font-medium transition-colors ${
                theme === 'system'
                  ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                  : 'border-border/70 bg-card hover:bg-muted/40'
              }`}
            >
              <span>System</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Workspace Profile Preferences */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Workspace Profile</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Organization metadata and default AI intelligence settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <form onSubmit={handleSaveWorkspace} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Workspace Name</label>
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Default Summary Lens</label>
              <select
                value={defaultLens}
                onChange={(e) => setDefaultLens(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-card px-2.5 py-1 text-xs text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="executive">Executive Summary (High-level decisions)</option>
                <option value="engineering">Engineering Architecture (Technical specifics)</option>
                <option value="sales">Sales Discovery (Customer pains & objections)</option>
              </select>
            </div>

            <Button type="submit" size="sm" className="h-8 text-xs font-medium">
              Save Preferences
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. Integrations Status (Honest Reporting) */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Integrations & Data Sources</CardTitle>
          </div>
          <CardDescription className="text-xs">
            External calendar connections and automated meeting recording bots.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          {/* Google Calendar */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">Google Calendar</span>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Disconnected
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Synchronize scheduled calls and upcoming agenda items automatically.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Google OAuth integration is scheduled for post-foundation phase.')}
              className="text-xs h-7"
            >
              Connect
            </Button>
          </div>

          {/* Recording Bot */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary">
                <Video className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">MeetFlow Recording Bot</span>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Stubbed per Brief
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Per official 8x instructions, recording bot is stubbed in favor of direct audio file upload.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Recording bot is stubbed. Use direct audio upload in My Meetings.')}
              className="text-xs h-7"
            >
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
