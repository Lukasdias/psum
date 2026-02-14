import type { ProjectSummary, ScanOptions, EntryPoint, Module, LanguageStats } from '../types.js';
import { detectEntryPoints } from './entry-points.js';
import { detectModules } from './modules.js';
import { detectConfigFiles, getLanguageFromExtension } from './config-files.js';
import { readdir, stat, readFile } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

export async function scanProject(
  root: string,
  options: ScanOptions = {}
): Promise<ProjectSummary> {
  const { depth = 3, includeTests = true, excludePatterns = [] } = options;

  const [entryPoints, modules, configFiles] = await Promise.all([
    detectEntryPoints(root),
    detectModules(root, depth),
    detectConfigFiles(root),
  ]);

  const stats = await calculateStats(root, includeTests, excludePatterns);

  return {
    name: await detectProjectName(root),
    root,
    type: detectProjectType(configFiles, entryPoints),
    entryPoints,
    modules,
    dependencies: {
      nodes: modules.map(m => m.name),
      edges: [],
    },
    stats,
    configFiles,
    generatedAt: new Date().toISOString(),
  };
}

async function detectProjectName(root: string): Promise<string> {
  try {
    const pkgPath = join(root, 'package.json');
    const content = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);
    return pkg.name || basename(root);
  } catch {
    return basename(root);
  }
}

function detectProjectType(
  configFiles: string[],
  entryPoints: EntryPoint[]
): ProjectSummary['type'] {
  if (configFiles.some(f => f.includes('Cargo.toml'))) return 'rust';
  if (configFiles.some(f => f.includes('go.mod'))) return 'go';
  if (configFiles.some(f => f.includes('requirements.txt') || f.includes('pyproject.toml'))) {
    return 'python';
  }

  const hasTsConfig = configFiles.some(f => f.includes('tsconfig'));
  const hasJsFiles = entryPoints.some(e => e.path.endsWith('.js') || e.path.endsWith('.jsx'));
  const hasTsFiles = entryPoints.some(e => e.path.endsWith('.ts') || e.path.endsWith('.tsx'));

  if (hasTsConfig || hasTsFiles) return 'typescript';
  if (hasJsFiles) return 'javascript';

  return 'unknown';
}

async function calculateStats(
  root: string,
  includeTests: boolean,
  excludePatterns: string[]
): Promise<{ totalFiles: number; totalLines: number; languages: LanguageStats }> {
  let totalFiles = 0;
  let totalLines = 0;
  const languages: LanguageStats = {};

  const ignoreList = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.svelte-kit',
    'coverage',
    ...excludePatterns,
  ];

  if (!includeTests) {
    ignoreList.push('test', 'tests', '__tests__', '*.test.*', '*.spec.*');
  }

  const { glob } = await import('fast-glob');

  const files = await glob(['**/*'], {
    cwd: root,
    ignore: ignoreList.map(i => `**/${i}/**`),
    onlyFiles: true,
    dot: false,
  });

  const batchSize = 50;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (file) => {
        try {
          const ext = extname(file).slice(1);
          const lang = getLanguageFromExtension(ext);

          const content = await readFile(join(root, file), 'utf-8');
          const lines = content.split('\n').length;

          totalFiles++;
          totalLines += lines;
          languages[lang] = (languages[lang] || 0) + 1;
        } catch {
        }
      })
    );
  }

  return { totalFiles, totalLines, languages };
}