import { SCENARIO_SNIPPETS } from '../scenarios.snippets';
import type { ScenarioName } from '../scenarios';

// Import the actual scenarios file to validate line numbers
const fs = require('fs');
const path = require('path');

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

  it('should have line numbers that approximately match scenarios.ts', () => {
    // Read the actual scenarios.ts file
    const scenariosPath = path.join(__dirname, '../scenarios.ts');
    const scenariosContent = fs.readFileSync(scenariosPath, 'utf-8');
    const lines = scenariosContent.split('\n');

    Object.entries(SCENARIO_SNIPPETS).forEach(([scenarioName, snippet]) => {
      // Find the first line of the snippet in the file
      const firstLine = snippet.code.split('\n')[0].trim();
      const actualLineIndex = lines.findIndex(l => l.trim().includes(firstLine));

      // The recorded line should be close to the actual line (within ±10 lines)
      // We use 1-indexed line numbers, so add 1 to the index
      const actualLine = actualLineIndex + 1;
      expect(actualLine).toBeGreaterThan(0); // Found in file
      expect(Math.abs(actualLine - snippet.line)).toBeLessThanOrEqual(10);
    });
  });
});
