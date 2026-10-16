import React from 'react';
import { render, waitFor, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LabProvider, useLab } from '@/src/lab/LabContext';

// Wrapper for tests
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <LabProvider>{children}</LabProvider>
    </QueryClientProvider>
  );
}

describe('Lab deep link and scenario handling', () => {
  it('should ensure selectScenario is stable across renders (useCallback)', async () => {
    const { result, rerender: rerenderHook } = renderHook(() => useLab(), {
      wrapper: createWrapper(),
    });

    // Wait for lab to be ready
    await waitFor(() => {
      expect(result.current.labReady).toBe(true);
    });

    const firstSelectScenario = result.current.selectScenario;

    // Trigger a re-render
    rerenderHook(undefined);

    const secondSelectScenario = result.current.selectScenario;

    // selectScenario should be the same reference (memoized with useCallback)
    expect(firstSelectScenario).toBe(secondSelectScenario);
  });

  it('should ensure all context functions are stable (useCallback)', async () => {
    const { result, rerender: rerenderHook } = renderHook(() => useLab(), {
      wrapper: createWrapper(),
    });

    // Wait for lab to be ready
    await waitFor(() => {
      expect(result.current.labReady).toBe(true);
    });

    const firstFunctions = {
      setDataSource: result.current.setDataSource,
      setScenario: result.current.setScenario,
      selectScenario: result.current.selectScenario,
      addLogEntry: result.current.addLogEntry,
      clearLog: result.current.clearLog,
      completeWalkthrough: result.current.completeWalkthrough,
    };

    // Trigger a re-render
    rerenderHook(undefined);

    const secondFunctions = {
      setDataSource: result.current.setDataSource,
      setScenario: result.current.setScenario,
      selectScenario: result.current.selectScenario,
      addLogEntry: result.current.addLogEntry,
      clearLog: result.current.clearLog,
      completeWalkthrough: result.current.completeWalkthrough,
    };

    // All functions should be the same reference (memoized with useCallback)
    expect(firstFunctions.setDataSource).toBe(secondFunctions.setDataSource);
    expect(firstFunctions.setScenario).toBe(secondFunctions.setScenario);
    expect(firstFunctions.selectScenario).toBe(secondFunctions.selectScenario);
    expect(firstFunctions.addLogEntry).toBe(secondFunctions.addLogEntry);
    expect(firstFunctions.clearLog).toBe(secondFunctions.clearLog);
    expect(firstFunctions.completeWalkthrough).toBe(secondFunctions.completeWalkthrough);
  });
});
