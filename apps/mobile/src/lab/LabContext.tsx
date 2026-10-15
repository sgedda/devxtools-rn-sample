import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { startMocking, stopMocking, applyScenario, resetHandlers } from '../mocks/native';
import { scenarios, type ScenarioName } from '../mocks/scenarios';
import { resetMockTasks } from '../mocks/handlers';

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
  const requestSourcesRef = useRef<Map<string, { source: 'msw' | 'real'; handler?: string }>>(new Map());

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
    setRequestLogCallback((entry) => {
      const source = requestSourcesRef.current.get(entry.url);
      const logEntry: RequestLogEntry = {
        ...entry,
        source: source?.source || 'real',
        handler: source?.handler,
        scenario: scenarioRef.current || undefined,
      };
      setRequestLog(prev => [logEntry, ...prev].slice(0, 50));
    });

    // Callback from MSW lifecycle events
    setRequestSourceCallback((requestId: string, source: 'msw' | 'real', handler?: string) => {
      requestSourcesRef.current.set(requestId, { source, handler });
    });

    return () => {
      setRequestLogCallback(null);
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
          // Apply the scenario BEFORE rendering
          applyScenario(scenarios[savedScenario as ScenarioName]);
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
    // Clear log BEFORE the data source change triggers refetch
    setRequestLog([]);
    requestSourcesRef.current.clear();

    setDataSourceState(source);
    dataSourceRef.current = source;
    await AsyncStorage.setItem(STORAGE_KEYS.DATA_SOURCE, source);

    if (source === 'msw') {
      await startMocking();
      if (scenario) {
        resetHandlers();
        resetMockTasks();
        applyScenario(scenarios[scenario]);
      }
    } else {
      stopMocking();
    }

    // Reset queries after log is cleared
    queryClient.resetQueries({ queryKey: ['tasks'] });
  };

  const setScenario = async (newScenario: ScenarioName | null) => {
    // Clear log BEFORE the scenario change triggers refetch
    setRequestLog([]);
    requestSourcesRef.current.clear();

    setScenarioState(newScenario);

    if (newScenario) {
      await AsyncStorage.setItem(STORAGE_KEYS.SCENARIO, newScenario);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.SCENARIO);
    }

    if (dataSourceRef.current === 'msw') {
      if (newScenario) {
        resetHandlers();
        resetMockTasks();
        applyScenario(scenarios[newScenario]);
      } else {
        resetHandlers();
        resetMockTasks();
      }

      // Reset queries after log is cleared
      queryClient.resetQueries({ queryKey: ['tasks'] });
    }
  };

  // Atomic scenario selection that switches to MSW if needed
  const selectScenario = async (newScenario: ScenarioName) => {
    // Clear log BEFORE the scenario change
    setRequestLog([]);
    requestSourcesRef.current.clear();

    if (dataSourceRef.current !== 'msw') {
      // Switch to MSW first
      setDataSourceState('msw');
      dataSourceRef.current = 'msw';
      await AsyncStorage.setItem(STORAGE_KEYS.DATA_SOURCE, 'msw');
      await startMocking();
    }

    // Now apply the scenario
    setScenarioState(newScenario);
    await AsyncStorage.setItem(STORAGE_KEYS.SCENARIO, newScenario);
    resetHandlers();
    resetMockTasks();
    applyScenario(scenarios[newScenario]);

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
      }}>
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
