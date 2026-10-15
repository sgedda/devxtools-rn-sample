import { setupServer } from 'msw/native';
import { handlers } from './handlers';
import type { RequestHandler } from 'msw';

// Setup MSW server for React Native
export const worker = setupServer(...handlers);

// Start the worker
export function startMocking() {
  worker.listen({
    onUnhandledRequest: 'bypass',
  });
  console.log('[MSW] Mocking enabled');
}

// Stop the worker
export function stopMocking() {
  worker.close();
  console.log('[MSW] Mocking disabled');
}

// Apply a scenario
export function applyScenario(scenarioHandlers: RequestHandler[]) {
  worker.use(...scenarioHandlers);
  console.log('[MSW] Scenario applied');
}

// Reset handlers to default
export function resetHandlers() {
  worker.resetHandlers();
  console.log('[MSW] Handlers reset');
}
