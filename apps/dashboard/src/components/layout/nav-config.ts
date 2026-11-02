import {
  LayoutDashboard,
  Video,
  CheckSquare,
  Calendar,
  Sparkles,
} from 'lucide-react';

export interface NavItemConfig {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Paths (besides `path`) that should mark this item active. */
  matchPrefixes?: string[];
}

export const PRIMARY_NAV_ITEMS: NavItemConfig[] = [
  { title: 'Overview', path: '/overview', icon: LayoutDashboard },
  {
    title: 'My Meetings',
    path: '/',
    icon: Video,
    matchPrefixes: ['/meetings'],
  },
  { title: 'Action Items', path: '/actions', icon: CheckSquare },
  { title: 'Companies & Projects', path: '/projects', icon: LayoutDashboard },
  { title: 'Project Board', path: '/board', icon: LayoutDashboard },
  { title: 'Decision Memory', path: '/decisions', icon: CheckSquare },
  { title: 'AI Actions', path: '/ai-actions', icon: Sparkles },
  { title: 'Calendar', path: '/calendar', icon: Calendar },
  { title: 'Ask MeetFlow', path: '/ask', icon: Sparkles },
];

export function isNavItemActive(
  item: NavItemConfig,
  currentPath: string,
): boolean {
  if (typeof currentPath !== 'string') return false;
  if (currentPath === item.path) return true;
  return (item.matchPrefixes ?? []).some((p) => currentPath.startsWith(p));
}

/** Contextual header title for a route. */
export function getPageTitle(path: string): {
  section: string;
  detail?: string;
} {
  if (typeof path !== 'string') return { section: 'MeetFlow' };
  if (path === '/overview') return { section: 'Overview' };
  if (path === '/' || path === '/meetings') return { section: 'My Meetings' };
  if (path.startsWith('/meetings/'))
    return { section: 'My Meetings', detail: 'Meeting' };
  if (path === '/actions') return { section: 'Action Items' };
  if (path === '/calendar') return { section: 'Calendar' };
  if (path === '/ask') return { section: 'Ask MeetFlow' };
  if (path === '/settings') return { section: 'Settings' };
  if (path === '/design') return { section: 'Design System' };
  return { section: 'MeetFlow' };
}
