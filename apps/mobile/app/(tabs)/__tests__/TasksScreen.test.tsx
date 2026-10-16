import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TasksScreen from '../index';
import { server } from '@/src/mocks/server.test-setup';
import { scenarios } from '@/src/mocks/scenarios';

// Wrapper matching production layout: QueryClient wraps LabProvider
function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const { LabProvider } = require('@/src/lab/LabContext');

  return (
    <QueryClientProvider client={queryClient}>
      <LabProvider>{children}</LabProvider>
    </QueryClientProvider>
  );
}

describe('TasksScreen with MSW - Component Test (CORE TEACHING DEMO)', () => {
  it('renders Tasks screen with empty scenario using shared MSW handlers', async () => {
    // TEACHING MOMENT: This uses the EXACT SAME handler from src/mocks/scenarios.ts
    // that the Lab modal uses. Import it directly - no duplication.
    server.use(...scenarios.empty.handlers);

    render(
      <Wrapper>
        <TasksScreen />
      </Wrapper>
    );

    // Wait for Lab to be ready - may skip loading if query resolves fast
    await waitFor(
      () => {
        const empty = screen.queryByTestId('tasks-empty');
        const loading = screen.queryByTestId('tasks-loading');
        expect(empty || loading).toBeTruthy();
      },
      { timeout: 2000 }
    );

    // Then verify empty state
    await waitFor(
      () => {
        expect(screen.getByTestId('tasks-empty')).toBeTruthy();
      },
      { timeout: 3000 }
    );

    // Verify empty state content
    expect(screen.getByText('No tasks yet')).toBeTruthy();
  });

  it('renders Tasks screen with 500 error using shared MSW handlers', async () => {
    // TEACHING MOMENT: This uses the EXACT SAME handler from src/mocks/scenarios.ts
    // that the Lab modal uses for the "Server error 500" scenario chip.
    server.use(...scenarios.error500.handlers);

    render(
      <Wrapper>
        <TasksScreen />
      </Wrapper>
    );

    // Wait for Lab to be ready - may skip loading if query resolves fast
    await waitFor(
      () => {
        const error = screen.queryByTestId('tasks-error');
        const loading = screen.queryByTestId('tasks-loading');
        expect(error || loading).toBeTruthy();
      },
      { timeout: 2000 }
    );

    // Then verify error state
    await waitFor(
      () => {
        expect(screen.getByTestId('tasks-error')).toBeTruthy();
      },
      { timeout: 3000 }
    );

    // Verify error state shows the server message
    expect(screen.getByText('Error')).toBeTruthy();
    expect(screen.getByText(/Internal server error/)).toBeTruthy();
    expect(screen.getByTestId('retry-button')).toBeTruthy();
  });
});
