import { SummaryTemplateId } from '../../../types/meeting';
import {
  FileText,
  Briefcase,
  TrendingUp,
  Cpu,
  Layers,
  UserCheck,
} from 'lucide-react';

export interface SummaryTemplateSelectorProps {
  currentTemplate: SummaryTemplateId;
  onSelectTemplate: (templateId: SummaryTemplateId) => void;
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
}: SummaryTemplateSelectorProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pr-1 shrink-0">
        Template:
      </span>
      {TEMPLATE_OPTIONS.map((tmpl) => {
        const Icon = tmpl.icon;
        const isActive = currentTemplate === tmpl.id;
        return (
          <button
            key={tmpl.id}
            type="button"
            onClick={() => onSelectTemplate(tmpl.id)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap select-none ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                : 'bg-secondary/70 text-secondary-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{tmpl.label}</span>
          </button>
        );
      })}
    </div>
  );
}
