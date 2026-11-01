import {
  Briefcase,
  Cpu,
  Layers,
  Headphones,
  Crown,
  UserCheck,
  Sparkles,
  Check,
} from 'lucide-react';

export interface RoleStepProps {
  selectedRole: string;
  onSelectRole: (role: string) => void;
}

const ROLES = [
  { id: 'Engineering', label: 'Engineering', description: 'Architecture, sprints, technical syncs', icon: Cpu },
  { id: 'Product', label: 'Product', description: 'Specs, roadmaps, design reviews', icon: Layers },
  { id: 'Sales', label: 'Sales', description: 'Discovery, demos, deal negotiation', icon: Briefcase },
  { id: 'Customer Success', label: 'Customer Success', description: 'Onboarding, accounts, customer retention', icon: Headphones },
  { id: 'Founder / Leadership', label: 'Founder / Leadership', description: 'Board meetings, strategy, all-hands', icon: Crown },
  { id: 'Recruiting', label: 'Recruiting', description: 'Candidate interviews, hiring debriefs', icon: UserCheck },
  { id: 'Other', label: 'Other', description: 'General meeting intelligence', icon: Sparkles },
];

export function RoleStep({ selectedRole, onSelectRole }: RoleStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
          What best describes your work?
        </h2>
        <p className="text-xs text-muted-foreground">
          MeetFlow customizes default meeting templates and summary formats based on your role.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ROLES.map((r) => {
          const Icon = r.icon;
          const isSelected = selectedRole === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRole(r.id)}
              className={`flex items-start justify-between rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                  : 'border-border bg-card hover:bg-secondary/60 hover:border-border/80'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {r.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1 mt-0.5">
                    {r.description}
                  </p>
                </div>
              </div>

              {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2 mt-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
