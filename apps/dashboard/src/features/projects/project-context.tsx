import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@meetflow/ui';
import { apiClient } from '../../lib/api-client';
export interface Project {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  status: string;
  needsReview: boolean;
}
export interface Company {
  id: string;
  name: string;
  description?: string | null;
  projects: Project[];
}
const storage = 'meetflow-project-context-v1';
const event = 'meetflow-project-context';
const subscribe = (fn: () => void) => {
  window.addEventListener(event, fn);
  window.addEventListener('storage', fn);
  return () => {
    window.removeEventListener(event, fn);
    window.removeEventListener('storage', fn);
  };
};
const snapshot = () => {
  try {
    return localStorage.getItem(storage) || '{}';
  } catch {
    return '{}';
  }
};
export function setProjectContext(companyId: string, projectId: string) {
  try {
    localStorage.setItem(storage, JSON.stringify({ companyId, projectId }));
  } catch {}
  window.dispatchEvent(new Event(event));
}
export function useProjectContext() {
  const raw = React.useSyncExternalStore(subscribe, snapshot, () => '{}');
  return React.useMemo(() => {
    try {
      return JSON.parse(raw) as { companyId?: string; projectId?: string };
    } catch {
      return {};
    }
  }, [raw]);
}
export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: ({ signal }) => apiClient<Company[]>('/companies', { signal }),
    staleTime: 60_000,
    retry: false,
  });
}
export function ProjectPicker({
  value,
  onChange,
  required = false,
  compact = false,
}: {
  value: { companyId?: string; projectId?: string };
  onChange: (value: { companyId: string; projectId: string }) => void;
  required?: boolean;
  compact?: boolean;
}) {
  const query = useCompanies();
  const client = useQueryClient();
  const [companySearch, setCompanySearch] = React.useState('');
  const [projectSearch, setProjectSearch] = React.useState('');
  const [create, setCreate] = React.useState<'company' | 'project' | null>(
    null,
  );
  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const company = query.data?.find((c) => c.id === value.companyId);
  const companies = (query.data ?? []).filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase()),
  );
  const projects = (company?.projects ?? []).filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()),
  );
  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (create === 'company') {
        const item = await apiClient<Company>('/companies', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim() }),
        });
        client.setQueryData<Company[]>(['companies'], (old = []) => [
          ...old,
          { ...item, projects: [] },
        ]);
        onChange({ companyId: item.id, projectId: '' });
      } else {
        const item = await apiClient<Project>('/projects', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            companyId: value.companyId,
          }),
        });
        client.setQueryData<Company[]>(['companies'], (old = []) =>
          old.map((c) =>
            c.id === item.companyId
              ? { ...c, projects: [...c.projects, item] }
              : c,
          ),
        );
        onChange({ companyId: item.companyId, projectId: item.id });
      }
      setCreate(null);
      setName('');
      void client.invalidateQueries({ queryKey: ['companies'] });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not create this record.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className={
        compact ? 'relative flex min-w-0 items-center gap-2' : 'space-y-3'
      }
    >
      {query.isError ? (
        <div role="alert" className="text-xs">
          <span>{query.error.message}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void query.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <details
            className="relative min-w-0 flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.open = false;
              }
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                const buttons = [
                  ...e.currentTarget.querySelectorAll<HTMLButtonElement>(
                    'button',
                  ),
                ];
                const index = buttons.indexOf(
                  document.activeElement as HTMLButtonElement,
                );
                buttons[
                  (index + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) %
                    buttons.length
                ]?.focus();
                e.preventDefault();
              }
            }}
          >
            <summary className="cursor-pointer truncate rounded-md border bg-card px-3 py-2 text-xs">
              {company?.name ||
                (required ? 'Select company *' : 'All companies')}
            </summary>
            <div className="absolute left-0 top-full z-50 mt-1 w-72 max-w-[85vw] rounded-lg border bg-popover p-2 shadow-lg">
              <Input
                aria-label="Search companies"
                placeholder="Search companies…"
                value={companySearch}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (companies[0]) {
                      onChange({ companyId: companies[0].id, projectId: '' });
                      e.currentTarget
                        .closest('details')
                        ?.removeAttribute('open');
                    } else {
                      setCreate('company');
                      setName(companySearch);
                      e.currentTarget
                        .closest('details')
                        ?.removeAttribute('open');
                    }
                  }
                }}
                onChange={(e) => setCompanySearch(e.target.value)}
              />
              <div className="my-2 max-h-48 overflow-auto">
                {!required && (
                  <button
                    type="button"
                    className="block w-full rounded p-2 text-left text-xs hover:bg-muted"
                    onClick={(e) => {
                      onChange({ companyId: '', projectId: '' });
                      e.currentTarget
                        .closest('details')
                        ?.removeAttribute('open');
                    }}
                  >
                    All companies
                  </button>
                )}
                {companies.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="block w-full rounded p-2 text-left text-xs hover:bg-muted focus:bg-muted"
                    onClick={(e) => {
                      onChange({ companyId: c.id, projectId: '' });
                      setProjectSearch('');
                      e.currentTarget
                        .closest('details')
                        ?.removeAttribute('open');
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  setCreate('company');
                  setName('');
                  e.currentTarget.closest('details')?.removeAttribute('open');
                }}
              >
                + Create Company
              </Button>
            </div>
          </details>
          <details
            className="relative min-w-0 flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Escape') e.currentTarget.open = false;
            }}
          >
            <summary className="cursor-pointer truncate rounded-md border bg-card px-3 py-2 text-xs">
              {company?.projects.find((p) => p.id === value.projectId)?.name ||
                (required ? 'Select project *' : 'All projects')}
            </summary>
            <div className="absolute right-0 top-full z-50 mt-1 w-72 max-w-[85vw] rounded-lg border bg-popover p-2 shadow-lg">
              {!company ? (
                <p className="p-2 text-xs text-muted-foreground">
                  Select a company first.
                </p>
              ) : (
                <>
                  <Input
                    aria-label="Search projects"
                    placeholder="Search projects…"
                    value={projectSearch}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (projects[0]) {
                          onChange({
                            companyId: company!.id,
                            projectId: projects[0].id,
                          });
                          e.currentTarget
                            .closest('details')
                            ?.removeAttribute('open');
                        } else {
                          setCreate('project');
                          setName(projectSearch);
                          e.currentTarget
                            .closest('details')
                            ?.removeAttribute('open');
                        }
                      }
                    }}
                    onChange={(e) => setProjectSearch(e.target.value)}
                  />
                  <div className="my-2 max-h-48 overflow-auto">
                    {!required && (
                      <button
                        type="button"
                        className="block w-full rounded p-2 text-left text-xs hover:bg-muted"
                        onClick={(e) => {
                          onChange({ companyId: company.id, projectId: '' });
                          e.currentTarget
                            .closest('details')
                            ?.removeAttribute('open');
                        }}
                      >
                        All projects
                      </button>
                    )}
                    {projects.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        className="block w-full rounded p-2 text-left text-xs hover:bg-muted focus:bg-muted"
                        onClick={(e) => {
                          onChange({ companyId: company.id, projectId: p.id });
                          e.currentTarget
                            .closest('details')
                            ?.removeAttribute('open');
                        }}
                      >
                        {p.name}
                        {p.needsReview ? ' · Needs assignment' : ''}
                      </button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      setCreate('project');
                      setName('');
                      e.currentTarget
                        .closest('details')
                        ?.removeAttribute('open');
                    }}
                  >
                    + Create Project
                  </Button>
                </>
              )}
            </div>
          </details>
        </>
      )}
      {create && (
        <div
          className={
            compact
              ? 'absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-popover p-3 shadow-lg'
              : 'rounded-lg border bg-muted/20 p-3'
          }
        >
          <label className="mb-2 block text-xs font-medium">
            New {create} name
          </label>
          <Input
            autoFocus
            value={name}
            maxLength={200}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void submit();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setCreate(null);
              }
            }}
          />
          {error && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busy || !name.trim()}
              onClick={() => void submit()}
            >
              {busy ? 'Creating…' : 'Create'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => setCreate(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
export function GlobalProjectPicker() {
  const value = useProjectContext();
  const companies = useCompanies();
  React.useEffect(() => {
    if (!companies.isSuccess || !value.companyId) return;
    const company = companies.data.find((item) => item.id === value.companyId);
    if (!company) setProjectContext('', '');
    else if (value.projectId && !company.projects.some((item) => item.id === value.projectId)) {
      setProjectContext(company.id, '');
    }
  }, [companies.isSuccess, companies.data, value.companyId, value.projectId]);
  return (
    <div className="w-[min(55vw,420px)]">
      <ProjectPicker
        value={value}
        onChange={(v) => setProjectContext(v.companyId, v.projectId)}
        compact
      />
    </div>
  );
}
export function useExecutionInvalidation() {
  const client = useQueryClient();
  return () => {
    for (const key of [
      'board',
      'task',
      'intelligence',
      'action-items',
      'overview',
      'meeting',
      'meetings',
      'meeting-pages',
      'companies',
    ])
      void client.invalidateQueries({ queryKey: [key] });
  };
}
