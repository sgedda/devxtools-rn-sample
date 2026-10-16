import { setupServer } from 'msw/native';
import { handlers, resetMockTasks } from './handlers';
import type { RequestHandler } from 'msw';

// Track request sources for logging
const requestMap = new Map<string, { scenario: string | null; startTime: number }>();
let currentScenario: string | null = null;
let requestSourceCallback:
  ((requestId: string, source: 'msw' | 'real', handler?: string) => void) | null = null;

// Store unsubscribe functions for cleanup
let unsubscribeFunctions: Array<() => void> = [];

export const server = setupServer(...handlers);

export function setRequestSourceCallback(
  callback: ((requestId: string, source: 'msw' | 'real', handler?: string) => void) | null
) {
  requestSourceCallback = callback;
}

function getCurrentScenario() {
  return currentScenario;
}

export async function startMocking() {
  // Remove any existing listeners before adding new ones
  unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  unsubscribeFunctions = [];

  // Wire up lifecycle events for request source tracking
  const startListener = ({ request }: { request: Request; requestId: string }) => {
    // Read unique request ID from header
    const requestId = request.headers.get('x-devx-req-id');
    if (requestId) {
      requestMap.set(requestId, {
        scenario: getCurrentScenario(),
        startTime: Date.now(),
      });
    }
  };
  server.events.on('request:start', startListener);
  unsubscribeFunctions.push(() => server.events.removeListener('request:start', startListener));

  const mockedListener = ({ request }: { request: Request }) => {
    const requestId = request.headers.get('x-devx-req-id');
    if (requestId) {
      const tracked = requestMap.get(requestId);
      if (tracked && requestSourceCallback) {
        requestSourceCallback(requestId, 'msw', tracked.scenario || undefined);
      }
      requestMap.delete(requestId);
    }
  };
  server.events.on('response:mocked', mockedListener);
  unsubscribeFunctions.push(() => server.events.removeListener('response:mocked', mockedListener));

  const unhandledListener = ({ request }: { request: Request }) => {
    const requestId = request.headers.get('x-devx-req-id');
    if (requestId) {
      const tracked = requestMap.get(requestId);
      if (tracked && requestSourceCallback) {
        requestSourceCallback(requestId, 'real', undefined);
      }
      requestMap.delete(requestId);
    }
  };
  server.events.on('request:unhandled', unhandledListener);
  unsubscribeFunctions.push(() =>
    server.events.removeListener('request:unhandled', unhandledListener)
  );

  const bypassListener = ({ request }: { request: Request }) => {
    const requestId = request.headers.get('x-devx-req-id');
    if (requestId) {
      const tracked = requestMap.get(requestId);
      if (tracked && requestSourceCallback) {
        requestSourceCallback(requestId, 'real', undefined);
      }
      requestMap.delete(requestId);
    }
  };
  server.events.on('response:bypass', bypassListener);
  unsubscribeFunctions.push(() => server.events.removeListener('response:bypass', bypassListener));

  server.listen({
    onUnhandledRequest: 'bypass',
  });
}

export function stopMocking() {
  server.close();
  requestMap.clear();

  // Remove all event listeners
  unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
  unsubscribeFunctions = [];
}

export function applyScenario(scenarioHandlers: RequestHandler[]) {
  server.use(...scenarioHandlers);
}

export function setCurrentScenario(scenario: string | null) {
  currentScenario = scenario;
}

export function resetHandlers() {
  server.resetHandlers();
  currentScenario = null;
}

// Re-export resetMockTasks for convenience
export { resetMockTasks };
