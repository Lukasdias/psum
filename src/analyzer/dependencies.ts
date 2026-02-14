import type { DependencyGraph } from '../types.js';
import { readFile } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';

const IMPORT_REGEX = /(?:import|export)\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]|(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

export async function buildDependencyGraph(
  files: string[],
  root: string
): Promise<DependencyGraph> {
  const nodes = new Set<string>();
  const edges: Array<{ from: string; to: string }> = [];

  const batchSize = 20;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (file) => {
        try {
          const content = await readFile(join(root, file), 'utf-8');
          const imports = extractImports(content);

          const moduleName = getModuleName(file);
          nodes.add(moduleName);

          for (const imp of imports) {
            if (isRelativeImport(imp)) {
              const resolved = resolveRelativeImport(file, imp, root);
              if (resolved) {
                const targetModule = getModuleName(resolved);
                nodes.add(targetModule);
                edges.push({ from: moduleName, to: targetModule });
              }
            } else if (isLocalAlias(imp, root)) {
              const resolved = resolveAliasImport(imp, root);
              if (resolved) {
                const targetModule = getModuleName(resolved);
                nodes.add(targetModule);
                edges.push({ from: moduleName, to: targetModule });
              }
            }
          }
        } catch {
        }
      })
    );
  }

  return {
    nodes: Array.from(nodes),
    edges: edges.filter((e, i, self) =>
      i === self.findIndex(t => t.from === e.from && t.to === e.to)
    ),
  };
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  let match: RegExpExecArray | null;

  IMPORT_REGEX.lastIndex = 0;
  while ((match = IMPORT_REGEX.exec(content)) !== null) {
    const imp = match[1] || match[2];
    if (imp) {
      imports.push(imp);
    }
  }

  return imports;
}

function isRelativeImport(path: string): boolean {
  return path.startsWith('./') || path.startsWith('../');
}

function resolveRelativeImport(sourceFile: string, importPath: string, root: string): string | null {
  const sourceDir = dirname(sourceFile);
  const resolved = join(sourceDir, importPath);

  const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];

  for (const ext of possibleExtensions) {
    try {
      const fullPath = join(root, resolved + ext);
      return relative(root, fullPath);
    } catch {
    }
  }

  return resolved;
}

function getModuleName(file: string): string {
  const parts = file.split('/');

  if (parts[0] === 'src' || parts[0] === 'lib' || parts[0] === 'app') {
    if (parts.length > 1) {
      return `${parts[0]}/${parts[1]}`;
    }
  }

  return parts[0];
}

async function isLocalAlias(importPath: string, root: string): Promise<boolean> {
  try {
    const tsConfigPath = join(root, 'tsconfig.json');
    const content = await readFile(tsConfigPath, 'utf-8');
    const config = JSON.parse(content);

    if (config.compilerOptions?.paths) {
      const aliases = Object.keys(config.compilerOptions.paths);
      return aliases.some(alias => importPath.startsWith(alias.replace('/*', '')));
    }
  } catch {
  }

  return false;
}

async function resolveAliasImport(importPath: string, root: string): Promise<string | null> {
  try {
    const tsConfigPath = join(root, 'tsconfig.json');
    const content = await readFile(tsConfigPath, 'utf-8');
    const config = JSON.parse(content);

    if (config.compilerOptions?.paths) {
      for (const [alias, targets] of Object.entries(config.compilerOptions.paths)) {
        const aliasPrefix = alias.replace('/*', '');
        if (importPath.startsWith(aliasPrefix)) {
          const suffix = importPath.slice(aliasPrefix.length);
          const targetBase = (targets as string[])[0]?.replace('/*', '') || '';
          return join(targetBase, suffix);
        }
      }
    }
  } catch {
  }

  return null;
}