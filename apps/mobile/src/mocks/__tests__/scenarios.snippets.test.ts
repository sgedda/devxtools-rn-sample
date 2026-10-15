import { readFileSync } from 'fs';
import { join } from 'path';
import { SCENARIO_SNIPPETS } from '../scenarios.snippets';

describe('scenarios.snippets', () => {
  it('should contain code snippets that appear in scenarios.ts', () => {
    // Read the actual scenarios.ts file
    const scenariosPath = join(__dirname, '../scenarios.ts');
    const scenariosSource = readFileSync(scenariosPath, 'utf-8');

    // Check each snippet's key phrases appear in the source
    Object.entries(SCENARIO_SNIPPETS).forEach(([scenarioName, { code, line }]) => {
      // Extract key phrases that must appear
      const keyPhrases = code.split('\n').filter(l => l.trim().length > 2);
      
      // Verify key phrases from the snippet appear in the source
      keyPhrases.forEach(phrase => {
        const normalizedPhrase = phrase.trim().replace(/\s+/g, ' ');
        if (normalizedPhrase && normalizedPhrase !== '{' && normalizedPhrase !== '}') {
          expect(scenariosSource).toContain(normalizedPhrase);
        }
      });
    });
  });

  it('should cover all scenarios', () => {
    const expectedScenarios = ['empty', 'slow', 'error500', 'validation400', 'offline', 'flaky'];
    const snippetKeys = Object.keys(SCENARIO_SNIPPETS);
    
    expectedScenarios.forEach(scenario => {
      expect(snippetKeys).toContain(scenario);
    });
  });
});
