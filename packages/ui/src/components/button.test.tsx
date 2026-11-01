import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button component', () => {
  it('renders default button with children text', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeDefined();
    expect(button.className).toContain('bg-primary');
  });

  it('renders secondary variant', () => {
    render(<Button variant="secondary">Secondary Action</Button>);
    const button = screen.getByRole('button', { name: /secondary action/i });
    expect(button.className).toContain('bg-secondary');
  });

  it('handles disabled state properly', () => {
    render(<Button disabled>Disabled Action</Button>);
    const button = screen.getByRole('button', { name: /disabled action/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.className).toContain('disabled:opacity-50');
  });
});
