import { describe, it, expect } from 'bun:test';
import { formatJSON } from '../formatters/json.js';
import type { ProjectSummary } from '../types.js';

describe('formatJSON', () => {
  const mockSummary: ProjectSummary = {
    name: 'test-project',
    root: '/test',
    type: 'typescript',
    entryPoints: [{ path: 'src/index.ts', type: 'library' }],
    modules: [{ name: 'src', path: 'src', files: 5, dependencies: [], exports: [] }],
    dependencies: { nodes: ['src'], edges: [], circular: [] },
    stats: { totalFiles: 10, totalLines: 500, languages: { TypeScript: 8, JSON: 2 } },
    configFiles: ['package.json'],
    generatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('returns valid JSON string', () => {
    const result = formatJSON(mockSummary);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('includes project name', () => {
    const result = formatJSON(mockSummary);
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe('test-project');
  });

  it('includes all required fields', () => {
    const result = formatJSON(mockSummary);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('name');
    expect(parsed).toHaveProperty('root');
    expect(parsed).toHaveProperty('type');
    expect(parsed).toHaveProperty('entryPoints');
    expect(parsed).toHaveProperty('modules');
    expect(parsed).toHaveProperty('dependencies');
    expect(parsed).toHaveProperty('stats');
    expect(parsed).toHaveProperty('configFiles');
    expect(parsed).toHaveProperty('generatedAt');
  });
});