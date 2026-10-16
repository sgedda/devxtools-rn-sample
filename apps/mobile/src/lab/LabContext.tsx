import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import {
  startMocking,
  stopMocking,
  applyScenario,
  resetHandlers,
  setRequestSourceCallback,
  setCurrentScenario,
  resetMockTasks,
} from '../mocks/native';
import { scenarios, type ScenarioName, scenarioLabels } from '../mocks/scenarios';
import { setRequestLogCallback } from '../api/client';

export type DataSource = 'real' | 'msw' | 'mockifyer';

interface LabContextType {
  dataSource: DataSource;
  scenario: ScenarioName | null;
  setDataSource: (source: DataSource) => Promise<void>;
  setScenario: (scenario: ScenarioName | null) => Promise<void>;
  selectScenario: (scenario: ScenarioName) => Promise<void>;
  requestLog: RequestLogEntry[];
  addLogEntry: (entry: RequestLogEntry) => void;
  clearLog: () => void;
  hasCompletedWalkthrough: boolean;
  completeWalkthrough: () => void;
  labReady: boolean;
}

export interface RequestLogEntry {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  source: 'real' | 'msw' | 'mockifyer';
  scenario?: string;
  handler?: string;
  divider?: boolean;
  dividerText?: string;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

const STORAGE_KEYS = {
  DATA_SOURCE: '@devx-tasks/data-source',
  SCENARIO: '@devx-tasks/scenario',
  WALKTHROUGH_COMPLETE: '@devx-tasks/walkthrough-complete',
};

export function LabProvider({ children }: { children: ReactNode }) {
  const [dataSource, setDataSourceState] = useState<DataSource>('real');
  const [scenario, setScenarioState] = useState<ScenarioName | null>(null);
  const [requestLog, setRequestLog] = useState<RequestLogEntry[]>([]);
  const [hasCompletedWalkthrough, setHasCompletedWalkthrough] = useState(false);
  const [labReady, setLabReady] = useState(false);
  const queryClient = useQueryClient();
  const dataSourceRef = useRef<DataSource>('real');
  const scenarioRef = useRef<ScenarioName | null>(null);
  const requestSourcesRef = useRef<Map<string, { source: 'msw' | 'real'; handler?: string }>>(
    new Map()
  );

  // Keep refs in sync
  useEffect(() => {
    dataSourceRef.current = dataSource;
  }, [dataSource]);

  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  // Wire up request logging callbacks
  useEffect(() => {
    // Callback from client.ts for all HTTP requests
    setRequestLogCallback(
      (entry: {
        id: string;
        timestamp: number;
        method: string;
        url: string;
        status?: number;
        duration?: number;
      }) => {
        // Look up source from requestSourcesRef - it was stamped by MSW events
        const sourceData = requestSourcesRef.current.get(entry.id);
        // If no MSW event fired, fall back to the current data source setting
        // When MSW is active, unlabeled requests are still MSW (may be bypassed/unhandled)
        // When Real is active, unlabeled requests are Real
        const fallbackSource = dataSourceRef.current === 'msw' ? 'msw' : 'real';
        const source = sourceData?.source || fallbackSource;
        const handler = sourceData?.handler;

        // Delete the entry after consuming it to avoid reuse
        requestSourcesRef.current.delete(entry.id);

        setRequestLog(prev => {
          const newLog = [
            {
              ...entry,
              source,
              handler,
              scenario: scenarioRef.current ?? undefined,
            },
            ...prev,
          ].slice(0, 50);
          return newLog;
        });
      }
    );

    // Callback from native.ts for MSW worker lifecycle events
    setRequestSourceCallback((requestId: string, source: 'msw' | 'real', handler?: string) => {
      // Stamp the source at MSW event time
      requestSourcesRef.current.set(requestId, { source, handler });
    });

    return () => {
      setRequestLogCallback(() => {});
      setRequestSourceCallback(null);
    };
  }, []);

  // Load persisted state on mount BEFORE first query
  useEffect(() => {
    async function loadState() {
      try {
        const [savedSource, savedScenario, walkthroughComplete] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.DATA_SOURCE),
          AsyncStorage.getItem(STORAGE_KEYS.SCENARIO),
          AsyncStorage.getItem(STORAGE_KEYS.WALKTHROUGH_COMPLETE),
        ]);

        if (savedSource) {
          setDataSourceState(savedSource as DataSource);
          dataSourceRef.current = savedSource as DataSource;
          if (savedSource === 'msw') {
            await startMocking();
          }
        }

        if (savedScenario && savedSource === 'msw') {
          setScenarioState(savedScenario as ScenarioName);
          scenarioRef.current = savedScenario as ScenarioName;
          // Apply the scenario BEFORE rendering
          const scenarioObj = scenarios[savedScenario as ScenarioName];
          applyScenario(scenarioObj.handlers);
          setCurrentScenario(scenarioObj.name);
        }

        if (walkthroughComplete === 'true') {
          setHasCompletedWalkthrough(true);
        }
      } catch (error) {
        console.error('Failed to load lab state:', error);
      } finally {
        // Signal that Lab is ready and queries can start
        setLabReady(true);
      }
    }

    loadState();
  }, []);

  const setDataSource = async (source: DataSource) => {
    const oldSource = dataSourceRef.current;

    setDataSourceState(source);
    dataSourceRef.current = source;
    await AsyncStorage.setItem(STORAGE_KEYS.DATA_SOURCE, source);

    if (source === 'msw') {
      await startMocking();
      if (scenario) {
        resetHandlers();
        resetMockTasks();
        const scenarioObj = scenarios[scenario];
        applyScenario(scenarioObj.handlers);
        setCurrentScenario(scenarioObj.name);
      }
    } else {
      stopMocking();
    }

    // Add divider when switching data sources
    if (oldSource !== source) {
      const dividerEntry: RequestLogEntry = {
        id: `divider-${Date.now()}`,
        timestamp: Date.now(),
        method: '',
        url: '',
        source: 'real',
        divider: true,
        dividerText: `Switched to ${source === 'msw' ? 'MSW' : 'Real'}`,
      };
      setRequestLog(prev => [dividerEntry, ...prev].slice(0, 50));
    }

    // Reset queries after log is cleared
    queryClient.resetQueries({ queryKey: ['tasks'] });
  };

  const setScenario = async (newScenario: ScenarioName | null) => {
    const oldScenario = scenarioRef.current;

    setScenarioState(newScenario);
    scenarioRef.current = newScenario;
    await AsyncStorage.setItem(STORAGE_KEYS.SCENARIO, newScenario || '');

    if (newScenario && scenarios[newScenario]) {
      applyScenario(scenarios[newScenario].handlers);
      setCurrentScenario(newScenario);
      // Reset scenario state (like flaky counter)
      const { resetScenarioState } = await import('../mocks/scenarios');
      resetScenarioState();
    } else {
      resetHandlers();
      setCurrentScenario(null);
    }

    // Add divider to log when switching scenarios
    if (oldScenario !== newScenario) {
      const dividerEntry: RequestLogEntry = {
        id: `divider-${Date.now()}`,
        timestamp: Date.now(),
        method: '',
        url: '',
        source: 'real',
        divider: true,
        dividerText: newScenario
          ? `Switched to ${scenarioLabels[newScenario]}`
          : 'Cleared scenario',
      };
      setRequestLog(prev => [dividerEntry, ...prev].slice(0, 50));
    }

    // Reset query data
    await queryClient.cancelQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    resetMockTasks();
  };

  // Atomic scenario selection that switches to MSW if needed
  const selectScenario = async (newScenario: ScenarioName) => {
    if (dataSourceRef.current !== 'msw') {
      // Switch to MSW first
      setDataSourceState('msw');
      dataSourceRef.current = 'msw';
      await AsyncStorage.setItem(STORAGE_KEYS.DATA_SOURCE, 'msw');
      await startMocking();
    }

    // Now apply the scenario
    setScenarioState(newScenario);
    scenarioRef.current = newScenario;
    await AsyncStorage.setItem(STORAGE_KEYS.SCENARIO, newScenario);
    resetHandlers();
    resetMockTasks();
    const scenarioObj = scenarios[newScenario];
    applyScenario(scenarioObj.handlers);
    setCurrentScenario(scenarioObj.name);

    // Reset queries after log is cleared
    queryClient.resetQueries({ queryKey: ['tasks'] });
  };

  const addLogEntry = (entry: RequestLogEntry) => {
    setRequestLog(prev => [entry, ...prev].slice(0, 50));
  };

  const clearLog = () => {
    setRequestLog([]);
  };

  const completeWalkthrough = async () => {
    setHasCompletedWalkthrough(true);
    await AsyncStorage.setItem(STORAGE_KEYS.WALKTHROUGH_COMPLETE, 'true');
  };

  return (
    <LabContext.Provider
      value={{
        dataSource,
        scenario,
        setDataSource,
        setScenario,
        selectScenario,
        requestLog,
        addLogEntry,
        clearLog,
        hasCompletedWalkthrough,
        completeWalkthrough,
        labReady,
      }}
    >
      {labReady ? children : null}
    </LabContext.Provider>
  );
}

export function useLab() {
  const context = useContext(LabContext);
  if (!context) {
    throw new Error('useLab must be used within LabProvider');
  }
  return context;
}
