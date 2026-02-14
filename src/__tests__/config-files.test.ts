import { describe, it, expect } from 'bun:test';
import { getLanguageFromExtension } from '../scanner/config-files.js';

describe('getLanguageFromExtension', () => {
  it('maps TypeScript extensions', () => {
    expect(getLanguageFromExtension('ts')).toBe('TypeScript');
    expect(getLanguageFromExtension('tsx')).toBe('TypeScript');
  });

  it('maps JavaScript extensions', () => {
    expect(getLanguageFromExtension('js')).toBe('JavaScript');
    expect(getLanguageFromExtension('jsx')).toBe('JavaScript');
    expect(getLanguageFromExtension('mjs')).toBe('JavaScript');
  });

  it('maps other languages', () => {
    expect(getLanguageFromExtension('py')).toBe('Python');
    expect(getLanguageFromExtension('rs')).toBe('Rust');
    expect(getLanguageFromExtension('go')).toBe('Go');
  });

  it('returns Unknown for unrecognized extensions', () => {
    expect(getLanguageFromExtension('xyz')).toBe('Unknown');
    expect(getLanguageFromExtension('')).toBe('Unknown');
  });

  it('handles case insensitivity', () => {
    expect(getLanguageFromExtension('TS')).toBe('TypeScript');
    expect(getLanguageFromExtension('JS')).toBe('JavaScript');
  });
});