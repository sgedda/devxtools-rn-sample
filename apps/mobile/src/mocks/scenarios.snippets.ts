import type { ScenarioName } from './scenarios';

// Hand-written snippets that must stay in sync with scenarios.ts
// A test validates these match the actual source
export const SCENARIO_SNIPPETS: Record<ScenarioName, { code: string; line: number }> = {
  empty: {
    code: `http.get('*/tasks', async () => {
  return HttpResponse.json({ tasks: [] });
});`,
    line: 6,
  },
  slow: {
    code: `http.get('*/tasks', async () => {
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
});`,
    line: 13,
  },
  error500: {
    code: `http.get('*/tasks', async () => {
  return HttpResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
});`,
    line: 30,
  },
  validation400: {
    code: `http.post('*/tasks', async () => {
  return HttpResponse.json(
    { error: 'Title cannot be empty' },
    { status: 400 }
  );
});`,
    line: 37,
  },
  offline: {
    code: `http.get('*/tasks', async () => {
  return HttpResponse.error();
});`,
    line: 44,
  },
  flaky: {
    code: `http.get('*/tasks', async () => {
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
});`,
    line: 56,
  },
};
