import { SummaryTemplateId } from '../../../types/meeting';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
} from '@meetflow/ui';
import {
  FileText,
  Briefcase,
  TrendingUp,
  Cpu,
  Layers,
  UserCheck,
  ChevronDown,
  Check,
} from 'lucide-react';

export interface SummaryTemplateSelectorProps {
  currentTemplate: SummaryTemplateId;
  onSelectTemplate: (templateId: SummaryTemplateId) => void;
  className?: string;
}

const TEMPLATE_OPTIONS: { id: SummaryTemplateId; label: string; icon: typeof FileText }[] = [
  { id: 'general', label: 'General', icon: FileText },
  { id: 'executive', label: 'Executive Brief', icon: Briefcase },
  { id: 'engineering', label: 'Engineering Sync', icon: Cpu },
  { id: 'product', label: 'Product Meeting', icon: Layers },
  { id: 'sales', label: 'Sales Call', icon: TrendingUp },
  { id: 'interview', label: 'Interview', icon: UserCheck },
];

export function SummaryTemplateSelector({
  currentTemplate,
  onSelectTemplate,
  className = '',
}: SummaryTemplateSelectorProps) {
  const currentOption =
    TEMPLATE_OPTIONS.find((t) => t.id === currentTemplate) || TEMPLATE_OPTIONS[0];
  const CurrentIcon = currentOption.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-muted-foreground font-medium shrink-0">
        Summary type:
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs font-medium border-border hover:bg-secondary/70"
            aria-label={`Select summary template. Current: ${currentOption.label}`}
          >
            <CurrentIcon className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{currentOption.label}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 p-1">
          {TEMPLATE_OPTIONS.map((tmpl) => {
            const Icon = tmpl.icon;
            const isSelected = tmpl.id === currentTemplate;
            return (
              <DropdownMenuItem
                key={tmpl.id}
                onClick={() => onSelectTemplate(tmpl.id)}
                className={`flex items-center justify-between text-xs px-2.5 py-1.5 cursor-pointer rounded-md ${
                  isSelected ? 'bg-primary/10 text-primary font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="truncate">{tmpl.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-1.5" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
