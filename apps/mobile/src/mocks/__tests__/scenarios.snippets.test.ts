import { SCENARIO_SNIPPETS } from '../scenarios.snippets';
import type { ScenarioName } from '../scenarios';

describe('scenarios.snippets', () => {
  it('should have code snippets for all scenarios', () => {
    const expectedScenarios: ScenarioName[] = [
      'empty',
      'slow',
      'error500',
      'validation400',
      'offline',
      'flaky',
    ];

    expectedScenarios.forEach(scenario => {
      const snippet = SCENARIO_SNIPPETS[scenario];
      expect(snippet).toBeDefined();
      expect(snippet.code).toBeDefined();
      expect(typeof snippet.code).toBe('string');
      expect(snippet.code.length).toBeGreaterThan(0);
      expect(snippet.line).toBeGreaterThan(0);
    });
  });

  it('should contain http.get or http.post in code snippets', () => {
    Object.entries(SCENARIO_SNIPPETS).forEach(([scenarioName, snippet]) => {
      const hasHttpMethod = snippet.code.includes('http.get') || snippet.code.includes('http.post');
      expect(hasHttpMethod).toBe(true);
    });
  });

  it('should contain HttpResponse in code snippets', () => {
    Object.entries(SCENARIO_SNIPPETS).forEach(([scenarioName, snippet]) => {
      expect(snippet.code).toContain('HttpResponse');
    });
  });
});
