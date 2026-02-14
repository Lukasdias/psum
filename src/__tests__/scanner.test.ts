import { describe, it, expect } from 'bun:test';
import { categorizeEntryPoint } from '../scanner/entry-points.js';

describe('categorizeEntryPoint', () => {
  it('detects CLI entry points', () => {
    expect(categorizeEntryPoint('src/cli.ts')).toBe('cli');
    expect(categorizeEntryPoint('bin/cmd.js')).toBe('cli');
    expect(categorizeEntryPoint('app/bin.ts')).toBe('cli');
  });

  it('detects server entry points', () => {
    expect(categorizeEntryPoint('server.ts')).toBe('server');
    expect(categorizeEntryPoint('handler.js')).toBe('server');
    expect(categorizeEntryPoint('api.ts')).toBe('server');
  });

  it('detects client entry points', () => {
    expect(categorizeEntryPoint('client.ts')).toBe('client');
    expect(categorizeEntryPoint('browser.js')).toBe('client');
    expect(categorizeEntryPoint('page.tsx')).toBe('client');
  });

  it('detects library entry points', () => {
    expect(categorizeEntryPoint('src/index.ts')).toBe('library');
    expect(categorizeEntryPoint('lib/main.js')).toBe('library');
    expect(categorizeEntryPoint('index.js')).toBe('library');
  });

  it('returns unknown for unrecognized patterns', () => {
    expect(categorizeEntryPoint('src/utils.ts')).toBe('unknown');
    expect(categorizeEntryPoint('helpers.js')).toBe('unknown');
  });
});