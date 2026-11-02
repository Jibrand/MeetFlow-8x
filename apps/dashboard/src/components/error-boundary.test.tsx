import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { ErrorBoundary } from './error-boundary';

function ProblemChild(): React.ReactElement {
  throw new Error('Test explosive failure');
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Smooth sailing content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Smooth sailing content')).toBeDefined();
  });

  it('renders graceful fallback UI when child component crashes', () => {
    // Suppress console.error during expected throw
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Something went wrong/i)).toBeDefined();
    expect(screen.queryByText(/Test explosive failure/i)).toBeNull();
    expect(screen.getByText(/We couldn’t load this view/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /reload page/i })).toBeDefined();

    spy.mockRestore();
  });
});
