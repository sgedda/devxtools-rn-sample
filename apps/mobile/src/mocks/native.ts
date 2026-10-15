import { setupServer } from 'msw/native';
import { handlers, resetMockTasks } from './handlers';
import type { RequestHandler } from 'msw';

export const server = setupServer(...handlers);

// Track request sources for logging
const requestSources = new Map<string, { source: 'msw' | 'real'; handler?: string }>();

// Callback for request logging
type RequestSourceCallback = (requestId: string, source: 'msw' | 'real', handler?: string) => void;
let requestSourceCallback: RequestSourceCallback | null = null;

export function setRequestSourceCallback(callback: RequestSourceCallback | null) {
  requestSourceCallback = callback;
}

// Listen to MSW lifecycle events
server.events.on('request:start', ({ request }) => {
  // Initialize as real (will be updated if mocked)
  const requestId = request.id;
  requestSources.set(requestId, { source: 'real' });
});

server.events.on('request:match', ({ request }) => {
  const requestId = request.id;
  requestSources.set(requestId, { source: 'msw' });
});

server.events.on('request:unhandled', ({ request }) => {
  const requestId = request.id;
  const entry = requestSources.get(requestId);
  if (entry) {
    entry.source = 'real';
    if (requestSourceCallback) {
      requestSourceCallback(requestId, 'real');
    }
  }
});

server.events.on('response:mocked', ({ request }) => {
  const requestId = request.id;
  const entry = requestSources.get(requestId);
  if (entry) {
    entry.source = 'msw';
    if (requestSourceCallback) {
      requestSourceCallback(requestId, 'msw');
    }
  }
});

server.events.on('response:bypass', ({ request }) => {
  const requestId = request.id;
  const entry = requestSources.get(requestId);
  if (entry) {
    entry.source = 'real';
    if (requestSourceCallback) {
      requestSourceCallback(requestId, 'real');
    }
  }
});

export function getRequestSource(
  requestId: string
): { source: 'msw' | 'real'; handler?: string } | null {
  return requestSources.get(requestId) || null;
}

export function startMocking() {
  server.listen({
    onUnhandledRequest: 'bypass',
  });
  console.log('[MSW] Mocking enabled');
}

export function stopMocking() {
  server.close();
  requestSources.clear();
  console.log('[MSW] Mocking disabled');
}

// Apply a scenario
export function applyScenario(scenarioHandlers: RequestHandler[]) {
  server.use(...scenarioHandlers);
  console.log('[MSW] Scenario applied');
}

// Reset handlers to default
export function resetHandlers() {
  server.resetHandlers();
  console.log('[MSW] Handlers reset');
}

// Re-export resetMockTasks for convenience
export { resetMockTasks };
