import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './root';
import { Button, Separator, TooltipProvider } from '@meetflow/ui';
import { Sparkles } from 'lucide-react';
import { useTheme } from '../providers/theme-provider';

import { TypographyShowcase } from '../components/design/typography-showcase';
import { ColorShowcase } from '../components/design/color-showcase';
import { MeetingShowcase } from '../components/design/meeting-showcase';
import { ControlsShowcase } from '../components/design/controls-showcase';
import { TableShowcase } from '../components/design/table-showcase';
import { FeedbackShowcase } from '../components/design/feedback-showcase';

export const designRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/design',
  component: DesignSystemPage,
});

function DesignSystemPage() {
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
        <TypographyShowcase />

        <Separator />

        {/* 2. Color Tokens */}
        <ColorShowcase />

        <Separator />

        {/* 3. Meeting-Specific Primitives */}
        <MeetingShowcase />

        <Separator />

        {/* 4 & 5. Controls, Buttons & Modals */}
        <ControlsShowcase />

        <Separator />

        {/* 6. High-Density Table */}
        <TableShowcase />

        <Separator />

        {/* 7. Loading, Empty & Error States */}
        <FeedbackShowcase />
      </div>
    </TooltipProvider>
  );
}
