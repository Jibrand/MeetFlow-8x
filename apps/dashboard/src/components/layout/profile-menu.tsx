import { Link } from '@tanstack/react-router';
import { Settings } from 'lucide-react';
export function ProfileMenu({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to="/settings"
      onClick={onNavigate}
      aria-label="Instance settings"
      className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-muted"
    >
      <Settings className="h-4 w-4" />
      {!collapsed && <span>Single admin · Settings</span>}
    </Link>
  );
}
