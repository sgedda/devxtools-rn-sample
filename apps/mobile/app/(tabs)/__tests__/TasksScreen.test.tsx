import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TasksScreen from '../index';
import { server, http, HttpResponse } from '@/src/mocks/server.test-setup';

// Simple wrapper with QueryClient and LabProvider
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
    <LabProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </LabProvider>
  );
}

describe('TasksScreen with MSW - Component Test (CORE TEACHING DEMO)', () => {
  it('renders Tasks screen with empty scenario using shared MSW handlers', async () => {
    // TEACHING MOMENT: This is the EXACT SAME handler from src/mocks/scenarios.ts
    // that the Lab modal uses. The component renders against it.
    server.use(
      http.get('*/tasks', async () => {
        return HttpResponse.json({ tasks: [] });
      })
    );

    render(
      <Wrapper>
        <TasksScreen />
      </Wrapper>
    );

    // Component should show loading first
    expect(screen.getByTestId('tasks-loading')).toBeTruthy();

    // Then transition to empty state
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
    // TEACHING MOMENT: This is the EXACT SAME handler from src/mocks/scenarios.ts
    // that the Lab modal uses for the "Server error 500" scenario chip.
    server.use(
      http.get('*/tasks', async () => {
        return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
      })
    );

    render(
      <Wrapper>
        <TasksScreen />
      </Wrapper>
    );

    // Component should show loading first
    expect(screen.getByTestId('tasks-loading')).toBeTruthy();

    // Then transition to error state
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
