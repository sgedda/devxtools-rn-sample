import { http, HttpResponse, delay } from 'msw';
import type { RequestHandler } from 'msw';

// Scenario: Empty list
export const emptyScenario: RequestHandler[] = [
  http.get('*/tasks', async () => {
    return HttpResponse.json({ tasks: [] });
  }),
];

// Scenario: Slow network (3s delay)
export const slowScenario: RequestHandler[] = [
  http.get('*/tasks', async () => {
    await delay(3000);
    return HttpResponse.json({
      tasks: [
        {
          id: 'slow-1',
          title: 'This took 3 seconds to load',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }),
];

// Scenario: Server error 500
export const error500Scenario: RequestHandler[] = [
  http.get('*/tasks', async () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
  }),
];

// Scenario: Validation error 400
export const validation400Scenario: RequestHandler[] = [
  http.post('*/tasks', async () => {
    return HttpResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
  }),
];

// Scenario: Network error (offline)
export const offlineScenario: RequestHandler[] = [
  http.get('*/tasks', async () => {
    return HttpResponse.error();
  }),
];

// Scenario: Flaky (fails 1 in 3 requests)
let flakyCounter = 0;

export function resetFlakyCounter() {
  flakyCounter = 0;
}

export const flakyScenario: RequestHandler[] = [
  http.get('*/tasks', async () => {
    flakyCounter++;
    if (flakyCounter % 3 === 0) {
      return HttpResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
    return HttpResponse.json({
      tasks: [
        {
          id: 'flaky-1',
          title: 'This request might fail (1 in 3)',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }),
];

export interface Scenario {
  name: string;
  handlers: RequestHandler[];
}

export type ScenarioName = 'empty' | 'slow' | 'error500' | 'validation400' | 'offline' | 'flaky';

export const scenarios: Record<ScenarioName, Scenario> = {
  empty: { name: 'empty', handlers: emptyScenario },
  slow: { name: 'slow', handlers: slowScenario },
  error500: { name: 'error500', handlers: error500Scenario },
  validation400: { name: 'validation400', handlers: validation400Scenario },
  offline: { name: 'offline', handlers: offlineScenario },
  flaky: { name: 'flaky', handlers: flakyScenario },
};

// Reset flaky counter when switching scenarios
export function resetScenarioState() {
  resetFlakyCounter();
}

export const scenarioLabels: Record<ScenarioName, string> = {
  empty: 'Empty',
  slow: 'Slow (3s)',
  error500: 'Server error 500',
  validation400: 'Validation 400',
  offline: 'Offline',
  flaky: 'Flaky (fails 1 in 3)',
};
