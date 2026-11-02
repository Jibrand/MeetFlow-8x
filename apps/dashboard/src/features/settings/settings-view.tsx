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
  toast,
} from '@meetflow/ui';
import { Palette, Layers, User, Loader2 } from 'lucide-react';
import { authAdapter, AuthUser } from '../auth/lib/auth-adapter';
import { apiClient } from '../../lib/api-client';

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = React.useState<AuthUser | null>(() => authAdapter.getCurrentUser());

  const [userName, setUserName] = React.useState(user?.name || '');
  const [workspaceName, setWorkspaceName] = React.useState(user?.workspace || '');
  const [orgName, setOrgName] = React.useState(user?.organizationName || '');

  const [savingUser, setSavingUser] = React.useState(false);
  const [savingWorkspace, setSavingWorkspace] = React.useState(false);

  React.useEffect(() => {
    return authAdapter.subscribe((u) => {
      setUser(u);
      if (u) {
        setUserName(u.name);
        setWorkspaceName(u.workspace);
        setOrgName(u.organizationName || '');
      }
    });
  }, []);

  // Fetch latest workspace & user profile details from backend
  React.useEffect(() => {
    async function loadData() {
      try {
        const ws = await apiClient<{ name: string; organizationName?: string | null }>('/workspaces/current');
        if (ws) {
          setWorkspaceName(ws.name);
          setOrgName(ws.organizationName || '');
        }
      } catch {
        // use cached state
      }
    }
    loadData();
  }, []);

  const handleSaveUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setSavingUser(true);
    try {
      await apiClient('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ name: userName.trim() }),
      });
      await authAdapter.syncSessionWithServer();
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingUser(false);
    }
  };

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      toast.error('Workspace name cannot be empty');
      return;
    }

    setSavingWorkspace(true);
    try {
      await apiClient('/workspaces/current', {
        method: 'PATCH',
        body: JSON.stringify({
          name: workspaceName.trim(),
          organizationName: orgName.trim() || null,
        }),
      });
      await authAdapter.syncSessionWithServer();
      toast.success('Workspace settings updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update workspace');
    } finally {
      setSavingWorkspace(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="border-b border-border/60 pb-5 space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Account & Workspace Settings
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage your personal profile, workspace details, and visual appearance.
        </p>
      </div>

      {/* 1. User Profile */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Personal Profile</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Your name and email associated with this MeetFlow account.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <form onSubmit={handleSaveUserProfile} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Full Name</label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="text-xs bg-card"
                placeholder="Your name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Work Email (Verified)</label>
              <Input
                value={user?.email || ''}
                disabled
                className="text-xs bg-muted/40 cursor-not-allowed opacity-80"
              />
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={savingUser}
              className="h-8 text-xs font-medium gap-1.5"
            >
              {savingUser && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Profile</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2. Workspace Profile Preferences */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Workspace Details</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Manage your organization metadata and team workspace identifier.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <form onSubmit={handleSaveWorkspace} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Workspace Name</label>
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="text-xs bg-card"
                placeholder="Workspace name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Organization / Company Name</label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="text-xs bg-card"
                placeholder="Optional company name"
              />
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={savingWorkspace}
              className="h-8 text-xs font-medium gap-1.5"
            >
              {savingWorkspace && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Update Workspace</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. Appearance / Theme */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Theme</CardTitle>
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

    </div>
  );
}
