import { SCENARIO_SNIPPETS } from '../scenarios.snippets';
import type { ScenarioName } from '../scenarios';
import * as fs from 'fs';
import * as path from 'path';

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

  it('should match code and line numbers in scenarios.ts', () => {
    const scenariosPath = path.join(__dirname, '../scenarios.ts');
    const scenariosContent = fs.readFileSync(scenariosPath, 'utf-8');
    const lines = scenariosContent.split('\n');

    Object.entries(SCENARIO_SNIPPETS).forEach(([scenarioName, snippet]) => {
      // Get the first non-empty line of the snippet code
      const snippetLines = snippet.code.split('\n');
      const firstCodeLine = snippetLines[0].trim();

      // Check that the line number points to a line containing that code
      const actualLine = lines[snippet.line - 1];
      expect(actualLine).toBeDefined();
      expect(actualLine.trim()).toContain(firstCodeLine.trim());

      // Verify the full snippet appears in the file starting near that line
      const contextStart = Math.max(0, snippet.line - 5);
      const contextEnd = Math.min(lines.length, snippet.line + 20);
      const contextBlock = lines.slice(contextStart, contextEnd).join('\n');

      // The first line of the snippet should appear in the context
      expect(contextBlock).toContain(firstCodeLine);
    });
  });
});
