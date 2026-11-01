import { CheckSquare, FileText, TrendingUp, Users, Database, Check } from 'lucide-react';

export interface UseCaseStepProps {
  selectedCases: string[];
  onToggleCase: (useCase: string) => void;
}

const USE_CASES = [
  {
    id: 'Automatic meeting notes',
    title: 'Automatic meeting notes',
    description: 'Executive summaries, bullet points, and key takeaways generated instantly',
    icon: FileText,
  },
  {
    id: 'Follow-up actions',
    title: 'Follow-up actions',
    description: 'Automated deliverable extraction, owner assignment, and due dates',
    icon: CheckSquare,
  },
  {
    id: 'Customer call intelligence',
    title: 'Customer call intelligence',
    description: 'Track customer feedback, objections, and feature requests across accounts',
    icon: TrendingUp,
  },
  {
    id: 'Team collaboration',
    title: 'Team collaboration',
    description: 'Share highlight clips, timestamped quotes, and searchable transcripts',
    icon: Users,
  },
  {
    id: 'Searchable meeting knowledge',
    title: 'Searchable meeting knowledge',
    description: 'Ask AI across your organization’s historical call records',
    icon: Database,
  },
];

export function UseCaseStep({ selectedCases, onToggleCase }: UseCaseStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
          What would you like MeetFlow to help with?
        </h2>
        <p className="text-xs text-muted-foreground">
          Select all use cases relevant to you and your team.
        </p>
      </div>

      <div className="space-y-2.5">
        {USE_CASES.map((u) => {
          const Icon = u.icon;
          const isSelected = selectedCases.includes(u.id);
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => onToggleCase(u.id)}
              className={`flex w-full items-start justify-between rounded-xl border p-3 text-left transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                  : 'border-border bg-card hover:bg-secondary/60 hover:border-border/80'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {u.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    {u.description}
                  </p>
                </div>
              </div>

              <div
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border mt-1 transition-colors ${
                  isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'
                }`}
              >
                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
