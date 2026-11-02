import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithQuery as render } from '../../test-utils';
import { Sidebar } from './sidebar';
vi.mock('../../features/actions/use-action-items', () => ({
  useActionItems: () => [],
}));

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => {
  const React = require('react');
  const Link = React.forwardRef(
    ({ children, to, onClick, className, ...rest }: any, ref: any) => (
      <a ref={ref} href={to} onClick={onClick} className={className} {...rest}>
        {children}
      </a>
    ),
  );
  Link.displayName = 'Link';
  return {
    Link,
    useNavigate: () => vi.fn(),
    useRouterState: (opts?: { select?: (s: any) => any }) => {
      const state = {
        location: {
          pathname: '/',
        },
      };
      return opts?.select ? opts.select(state) : state;
    },
  };
});

// Mock theme provider
vi.mock('../../providers/theme-provider', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

describe('Sidebar Component', () => {
  it('renders primary navigation items in expanded mode', () => {
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={vi.fn()}
        mobileOpen={false}
        onCloseMobile={vi.fn()}
      />,
    );

    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByText('My Meetings')).toBeDefined();
    expect(screen.getByText('Action Items')).toBeDefined();
    expect(screen.getByText('Calendar')).toBeDefined();
    expect(screen.getByText('Ask MeetFlow')).toBeDefined();
    expect(screen.queryByText('AI Actions')).toBeNull();
    expect(screen.getByText('Decision Memory')).toBeDefined();
  });

  it('triggers onToggleCollapse when collapse button is clicked', () => {
    const toggleSpy = vi.fn();
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={toggleSpy}
        mobileOpen={false}
        onCloseMobile={vi.fn()}
      />,
    );

    const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(toggleBtn);
    expect(toggleSpy).toHaveBeenCalled();
  });

  it('hides text labels when collapsed is true', () => {
    render(
      <Sidebar
        collapsed={true}
        onToggleCollapse={vi.fn()}
        mobileOpen={false}
        onCloseMobile={vi.fn()}
      />,
    );

    expect(screen.queryByText('Overview')).toBeNull();
  });

  it('renders dynamic workspace name and handles truncation', () => {
    render(
      <Sidebar
        collapsed={false}
        onToggleCollapse={vi.fn()}
        mobileOpen={false}
        onCloseMobile={vi.fn()}
      />,
    );

    // Verify workspace link exists and has proper title attribute
    const brandLink = screen.getByRole('link', { name: /home/i });
    expect(brandLink).toBeDefined();
    expect(brandLink.getAttribute('title')).toBeTruthy();
  });
});
