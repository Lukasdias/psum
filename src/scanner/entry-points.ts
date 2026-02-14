import type { EntryPoint } from '../types.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ENTRY_PATTERNS: Record<string, string[]> = {
  cli: ['cli.ts', 'cli.js', 'bin.ts', 'bin.js', 'cmd.ts', 'cmd.js'],
  server: ['server.ts', 'server.js', 'app.ts', 'app.js', 'index.ts', 'index.js', 'main.ts', 'main.js'],
  client: ['client.ts', 'client.js', 'browser.ts', 'browser.js'],
  library: ['index.ts', 'index.js', 'lib.ts', 'lib.js'],
};

const FRAMEWORK_PATTERNS: Record<string, string[]> = {
  next: ['page.tsx', 'page.jsx', 'layout.tsx', 'layout.jsx'],
  svelte: ['+page.svelte', '+layout.svelte', '+server.ts'],
  astro: ['index.astro', '[...slug].astro'],
};

export async function detectEntryPoints(root: string): Promise<EntryPoint[]> {
  const entries: EntryPoint[] = [];
  
  try {
    const pkgPath = join(root, 'package.json');
    const pkgContent = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);
    
    if (pkg.bin) {
      if (typeof pkg.bin === 'string') {
        entries.push({ path: pkg.bin, type: 'cli' });
      } else {
        Object.entries(pkg.bin).forEach(([, path]) => {
          entries.push({ path: path as string, type: 'cli' });
        });
      }
    }
    
    if (pkg.main && !entries.find(e => e.path === pkg.main)) {
      entries.push({ path: pkg.main, type: 'library' });
    }
    
    if (pkg.module && !entries.find(e => e.path === pkg.module)) {
      entries.push({ path: pkg.module, type: 'library' });
    }
  } catch {
  }
  
  const { glob } = await import('fast-glob');
  const files = await glob(['**/*.{ts,js,tsx,jsx,mjs}'], {
    cwd: root,
    ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
    onlyFiles: true,
    absolute: false,
  });

  for (const file of files) {
    const basename = file.split('/').pop() || '';

    for (const [type, patterns] of Object.entries(ENTRY_PATTERNS)) {
      if (patterns.includes(basename) && !entries.find(e => e.path === file)) {
        entries.push({ path: file, type: type as EntryPoint['type'] });
        break;
      }
    }
  }

  const frameworkFiles = await glob(['**/+page.svelte', '**/page.tsx', '**/index.astro'], {
    cwd: root,
    ignore: ['node_modules/**', '.svelte-kit/**', '.next/**'],
    onlyFiles: true,
  });
  
  for (const file of frameworkFiles) {
    if (!entries.find(e => e.path === file)) {
      entries.push({ path: file, type: 'client' });
    }
  }
  
  return entries;
}

export function categorizeEntryPoint(path: string): EntryPoint['type'] {
  const basename = path.split('/').pop()?.toLowerCase() || '';
  
  if (basename.includes('cli') || basename.includes('bin') || basename.includes('cmd')) {
    return 'cli';
  }
  if (basename.includes('server') || basename.includes('api') || basename.includes('handler')) {
    return 'server';
  }
  if (basename.includes('client') || basename.includes('browser') || basename.includes('page')) {
    return 'client';
  }
  if (basename.includes('index') || basename.includes('lib') || basename.includes('main')) {
    return 'library';
  }
  
  return 'unknown';
}