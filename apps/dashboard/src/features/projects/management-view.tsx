import * as React from 'react';
import { Link } from '@tanstack/react-router';
import {
  Button,
  Input,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Skeleton,
} from '@meetflow/ui';
import { apiClient } from '../../lib/api-client';
import {
  useCompanies,
  useExecutionInvalidation,
  setProjectContext,
  useProjectContext,
} from './project-context';
interface Form {
  kind: 'company' | 'project';
  id?: string;
  companyId?: string;
  name: string;
  description: string;
  status: string;
}
export function ManagementView() {
  const query = useCompanies();
  const context = useProjectContext();
  const invalidate = useExecutionInvalidation();
  const [form, setForm] = React.useState<Form | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState(false);
  const save = async (remove = false) => {
    if (!form) return;
    setBusy(true);
    setError(null);
    const path = form.kind === 'company' ? '/companies' : '/projects';
    try {
      const result = await apiClient<{ id: string; companyId?: string }>(
        path + (form.id ? `/${form.id}` : ''),
        {
          method: remove ? 'DELETE' : form.id ? 'PATCH' : 'POST',
          ...(remove
            ? {}
            : {
                body: JSON.stringify({
                  name: form.name.trim(),
                  description: form.description,
                  ...(form.kind === 'project'
                    ? {
                        status: form.status,
                        ...(!form.id ? { companyId: form.companyId } : {}),
                      }
                    : {}),
                }),
              }),
        },
      );
      if (!form.id)
        setProjectContext(
          form.kind === 'company' ? result.id : result.companyId!,
          form.kind === 'project' ? result.id : '',
        );
      if (remove) setProjectContext('', '');
      invalidate();
      setForm(null);
      setConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Companies & Projects</h1>
          <p className="text-xs text-muted-foreground">
            Keep each project’s meetings and execution history independent.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              setForm({
                kind: 'company',
                name: '',
                description: '',
                status: 'ACTIVE',
              });
            }}
          >
            + Company
          </Button>
          <Button
            disabled={!query.data?.length}
            onClick={() => {
              setError(null);
              setForm({
                kind: 'project',
                companyId: context.companyId || query.data?.[0]?.id,
                name: '',
                description: '',
                status: 'ACTIVE',
              });
            }}
          >
            + Project
          </Button>
        </div>
      </header>
      {query.isPending ? (
        <Skeleton className="h-48" />
      ) : query.error ? (
        <p role="alert">
          {query.error.message}
          <Button onClick={() => void query.refetch()}>Retry</Button>
        </p>
      ) : query.data?.length ? (
        query.data.map((company) => (
          <section
            key={company.id}
            className="space-y-4 rounded-xl border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">{company.name}</h2>
                {company.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {company.description}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setError(null);
                  setForm({
                    kind: 'company',
                    id: company.id,
                    name: company.name,
                    description: company.description ?? '',
                    status: 'ACTIVE',
                  });
                }}
              >
                Edit company
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {company.projects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-lg border bg-muted/20 p-4 space-y-3"
                >
                  <div>
                    <h3 className="text-sm font-medium">{project.name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {project.status}
                      {project.needsReview
                        ? ' · Review original assignment'
                        : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        to="/board"
                        onClick={() =>
                          setProjectContext(company.id, project.id)
                        }
                      >
                        Open board
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setError(null);
                        setForm({
                          kind: 'project',
                          id: project.id,
                          companyId: company.id,
                          name: project.name,
                          description: project.description ?? '',
                          status:
                            project.status === 'NEEDS_REVIEW'
                              ? 'ACTIVE'
                              : project.status,
                        });
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            {!company.projects.length && (
              <p className="text-xs text-muted-foreground">
                No projects yet. Create a project for this company to begin.
              </p>
            )}
          </section>
        ))
      ) : (
        <p className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
          Create your first company and project. No sample companies have been
          added.
        </p>
      )}
      <Dialog
        open={Boolean(form)}
        onOpenChange={(open) => {
          if (!open && !busy) setForm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form?.id ? 'Edit' : 'Create'} {form?.kind}
            </DialogTitle>
            <DialogDescription>
              Company and project assignment is explicit and never inferred from
              transcript content.
            </DialogDescription>
          </DialogHeader>
          {form && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <fieldset disabled={busy} className="space-y-3">
                {form.kind === 'project' && !form.id && (
                  <label className="block text-xs">
                    Company
                    <select
                      required
                      className="mt-1 w-full rounded border bg-card p-2"
                      value={form.companyId ?? ''}
                      onChange={(e) =>
                        setForm({ ...form, companyId: e.target.value })
                      }
                    >
                      {query.data?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="block text-xs">
                  Name
                  <Input
                    required
                    maxLength={200}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label className="block text-xs">
                  Description
                  <Textarea
                    maxLength={4000}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </label>
                {form.kind === 'project' && (
                  <label className="block text-xs">
                    Status
                    <select
                      className="mt-1 w-full rounded border bg-card p-2"
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      {['ACTIVE', 'PAUSED', 'ARCHIVED'].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                )}
              </fieldset>
              {error && (
                <p role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              )}
              <DialogFooter>
                {form.id && (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => setConfirm(true)}
                  >
                    Delete empty {form.kind}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setForm(null)}
                >
                  Cancel
                </Button>
                <Button disabled={busy || !form.name.trim()}>
                  {busy ? 'Saving…' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          )}
          <Dialog
            open={confirm}
            onOpenChange={(open) => {
              if (!busy) setConfirm(open);
            }}
          >
            <DialogContent role="alertdialog">
              <DialogHeader>
                <DialogTitle>Delete this {form?.kind}?</DialogTitle>
                <DialogDescription>
                  Only empty records can be deleted. Linked meetings, tasks and
                  history are protected.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={() => void save(true)}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    </div>
  );
}
