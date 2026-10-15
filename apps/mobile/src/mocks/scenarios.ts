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
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),
];

// Scenario: Validation error 400
export const validation400Scenario: RequestHandler[] = [
  http.post('*/tasks', async () => {
    return HttpResponse.json(
      { error: 'Title cannot be empty' },
      { status: 400 }
    );
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
export const flakyScenario: RequestHandler[] = [
  http.get('*/tasks', async () => {
    flakyCounter++;
    if (flakyCounter % 3 === 0) {
      return HttpResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
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

export type ScenarioName = 'empty' | 'slow' | 'error500' | 'validation400' | 'offline' | 'flaky';

export const scenarios: Record<ScenarioName, RequestHandler[]> = {
  empty: emptyScenario,
  slow: slowScenario,
  error500: error500Scenario,
  validation400: validation400Scenario,
  offline: offlineScenario,
  flaky: flakyScenario,
};

export const scenarioLabels: Record<ScenarioName, string> = {
  empty: 'Empty',
  slow: 'Slow (3s)',
  error500: 'Server error 500',
  validation400: 'Validation 400',
  offline: 'Offline',
  flaky: 'Flaky (fails 1 in 3)',
};
