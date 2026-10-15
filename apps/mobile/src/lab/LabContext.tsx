import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startMocking, stopMocking, applyScenario, resetHandlers } from '../mocks/native';
import { scenarios, type ScenarioName } from '../mocks/scenarios';
import { resetMockTasks } from '../mocks/handlers';

export type DataSource = 'real' | 'msw' | 'mockifyer';

interface LabContextType {
  dataSource: DataSource;
  scenario: ScenarioName | null;
  setDataSource: (source: DataSource) => void;
  setScenario: (scenario: ScenarioName | null) => void;
  requestLog: RequestLogEntry[];
  addLogEntry: (entry: RequestLogEntry) => void;
  clearLog: () => void;
  hasCompletedWalkthrough: boolean;
  completeWalkthrough: () => void;
  isHydrated: boolean;
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
  const [isHydrated, setIsHydrated] = useState(false);

  // Load persisted state on mount
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
          if (savedSource === 'msw') {
            startMocking();
            if (savedScenario) {
              applyScenario(scenarios[savedScenario as ScenarioName]);
            }
          }
        }

        if (savedScenario) {
          setScenarioState(savedScenario as ScenarioName);
        }

        if (walkthroughComplete === 'true') {
          setHasCompletedWalkthrough(true);
        }
      } catch (error) {
        console.error('Failed to load lab state:', error);
      } finally {
        setIsHydrated(true);
      }
    }

    loadState();
  }, []);

  const setDataSource = async (source: DataSource, withScenario?: ScenarioName | null) => {
    setDataSourceState(source);
    await AsyncStorage.setItem(STORAGE_KEYS.DATA_SOURCE, source);

    const effectiveScenario = withScenario !== undefined ? withScenario : scenario;

    if (source === 'msw') {
      startMocking();
      if (effectiveScenario) {
        applyScenario(scenarios[effectiveScenario]);
      }
    } else {
      stopMocking();
    }

    // Clear request log when switching sources
    setRequestLog([]);
  };

  const setScenario = async (newScenario: ScenarioName | null, withDataSource?: DataSource) => {
    setScenarioState(newScenario);

    if (newScenario) {
      await AsyncStorage.setItem(STORAGE_KEYS.SCENARIO, newScenario);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.SCENARIO);
    }

    const effectiveDataSource = withDataSource !== undefined ? withDataSource : dataSource;

    if (effectiveDataSource === 'msw') {
      if (newScenario) {
        resetHandlers();
        resetMockTasks();
        applyScenario(scenarios[newScenario]);
      } else {
        resetHandlers();
        resetMockTasks();
      }
    }

    // Clear request log when changing scenarios
    setRequestLog([]);
  };

  const addLogEntry = (entry: RequestLogEntry) => {
    setRequestLog(prev => [entry, ...prev].slice(0, 50)); // Keep last 50 entries
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
        requestLog,
        addLogEntry,
        clearLog,
        hasCompletedWalkthrough,
        completeWalkthrough,
        isHydrated,
      }}
    >
      {children}
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
