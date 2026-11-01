import { createRoute, Link } from '@tanstack/react-router';
import { rootRoute } from './root';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@meetflow/ui';
import { Sparkles, ArrowRight, ShieldCheck, Cpu, Code2, Database, Layout } from 'lucide-react';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Hero Badge & Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/50 px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>8x Assignment — Phase 01: Engineering Foundation</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          MeetFlow AI Workspace
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          A high-density meeting intelligence platform inspired by Fathom. Phase 01 establishes the
          monorepo workspace, shared design system, contracts, and backend services.
        </p>
      </div>

      {/* Quick Action Banner */}
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/design">
          <Button className="gap-1.5 text-xs h-8">
            Explore Design System (/design)
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
        <a
          href="/api/health"
          target="_blank"
          rel="noreferrer"
        >
          <Button variant="outline" className="gap-1.5 text-xs h-8">
            <Cpu className="h-3.5 w-3.5" />
            Verify Backend Health (/api/health)
          </Button>
        </a>
      </div>

      {/* Foundation Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <Layout className="h-4 w-4 text-primary" />
              <Badge variant="secondary">UI & Design</Badge>
            </div>
            <CardTitle className="text-sm mt-2">Design System Foundation</CardTitle>
            <CardDescription className="text-xs">
              Tailwind semantic tokens, dark/light modes, Radix primitives, and 100% zoom density optimization.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Linear-density controls (32px targets), compact typography, and restrained borders.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <Code2 className="h-4 w-4 text-primary" />
              <Badge variant="secondary">Contracts</Badge>
            </div>
            <CardTitle className="text-sm mt-2">Zod & Type Safety</CardTitle>
            <CardDescription className="text-xs">
              Shared schema definitions for health checks, domain models, and API responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Standard envelopes for success/error handling and input validation across client and server.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <Database className="h-4 w-4 text-primary" />
              <Badge variant="secondary">Backend</Badge>
            </div>
            <CardTitle className="text-sm mt-2">Express & Neon Prisma</CardTitle>
            <CardDescription className="text-xs">
              Structured logging, request IDs, CORS allowlist, and Prisma PostgreSQL schema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Zero premature database executions, ready for managed migrations in Phase 02.
          </CardContent>
        </Card>
      </div>

      {/* Capture System Verification Note */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>8x Agent Capture Active & Verified</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Continuous prompt-and-response recording is active via background transcript watcher and lifecycle hooks. Logs are saved to <code className="bg-muted px-1 py-0.5 rounded text-[11px]">.agent-logs/</code> and tracked in Git.
        </p>
      </div>
    </div>
  );
}
