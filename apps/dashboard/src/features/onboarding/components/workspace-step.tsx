import { Input } from '@meetflow/ui';
import { Building2, Sparkles } from 'lucide-react';

export interface WorkspaceStepProps {
  workspaceName: string;
  orgName: string;
  onWorkspaceNameChange: (val: string) => void;
  onOrgNameChange: (val: string) => void;
}

export function WorkspaceStep({
  workspaceName,
  orgName,
  onWorkspaceNameChange,
  onOrgNameChange,
}: WorkspaceStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
          Workspace setup
        </h2>
        <p className="text-xs text-muted-foreground">
          Your workspace is the home for your recordings, transcripts, and shared team notes.
        </p>
      </div>

      <div className="space-y-3.5 pt-2">
        <div className="space-y-1.5">
          <label htmlFor="workspace-name" className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Workspace Name *</span>
          </label>
          <Input
            id="workspace-name"
            type="text"
            placeholder="e.g. Acme Engineering Workspace"
            value={workspaceName}
            onChange={(e) => onWorkspaceNameChange(e.target.value)}
            className="h-9 text-xs bg-card"
          />
          <p className="text-[11px] text-muted-foreground">
            You can always invite team members and change this later in settings.
          </p>
        </div>

        <div className="space-y-1.5 pt-1">
          <label htmlFor="org-name" className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Organization / Company Name (Optional)</span>
          </label>
          <Input
            id="org-name"
            type="text"
            placeholder="e.g. Acme Corporation"
            value={orgName}
            onChange={(e) => onOrgNameChange(e.target.value)}
            className="h-9 text-xs bg-card"
          />
        </div>
      </div>
    </div>
  );
}
