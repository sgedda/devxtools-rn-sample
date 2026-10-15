import { setupServer } from 'msw/native';
import { handlers, resetMockTasks } from './handlers';
import type { RequestHandler } from 'msw';

// Track request sources for logging
const requestMap = new Map<string, { scenario: string | null; startTime: number }>();
let currentScenario: string | null = null;
let requestSourceCallback:
  ((requestId: string, source: 'msw' | 'real', handler?: string) => void) | null = null;

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
  // Wire up lifecycle events for request source tracking
  server.events.on('request:start', ({ request }: { request: Request; requestId: string }) => {
    // Track request start with current scenario - use URL as key
    const url = request.url;
    console.log(`[MSW] request:start url=${url.slice(0, 50)}..., scenario=${getCurrentScenario()}`);
    requestMap.set(url, {
      scenario: getCurrentScenario(),
      startTime: Date.now(),
    });
  });

  server.events.on('response:mocked', ({ request }: { request: Request }) => {
    const url = request.url;
    const tracked = requestMap.get(url);
    console.log(`[MSW] response:mocked url=${url.slice(0, 50)}..., tracked=`, tracked);
    if (tracked && requestSourceCallback) {
      requestSourceCallback(url, 'msw', tracked.scenario || undefined);
    }
    requestMap.delete(url);
  });

  server.events.on('request:unhandled', ({ request }: { request: Request }) => {
    const url = request.url;
    const tracked = requestMap.get(url);
    console.log(`[MSW] request:unhandled url=${url.slice(0, 50)}..., tracked=`, tracked);
    if (tracked && requestSourceCallback) {
      requestSourceCallback(url, 'real', undefined);
    }
    requestMap.delete(url);
  });

  server.events.on('response:bypass', ({ request }: { request: Request }) => {
    const url = request.url;
    const tracked = requestMap.get(url);
    console.log(`[MSW] response:bypass url=${url.slice(0, 50)}..., tracked=`, tracked);
    if (tracked && requestSourceCallback) {
      requestSourceCallback(url, 'real', undefined);
    }
    requestMap.delete(url);
  });

  server.listen({
    onUnhandledRequest: 'bypass',
  });

  console.log('[MSW] Mocking enabled');
}

export function stopMocking() {
  server.close();
  requestMap.clear();
  console.log('[MSW] Mocking disabled');
}

export function applyScenario(scenarioHandlers: RequestHandler[]) {
  server.use(...scenarioHandlers);
  console.log('[MSW] Applied scenario');
}

export function setCurrentScenario(scenario: string | null) {
  currentScenario = scenario;
}

export function resetHandlers() {
  server.resetHandlers();
  currentScenario = null;
  console.log('[MSW] Reset handlers');
}

// Re-export resetMockTasks for convenience
export { resetMockTasks };
