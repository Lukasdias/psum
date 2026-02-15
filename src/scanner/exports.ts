import type { ExportInfo } from '../types.js';
import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const EXPORT_PATTERNS = {
  namedExport: /^\s*export\s+(?:async\s+)?(function|class|interface|type|enum|const|let|var)\s+(\w+)/,
  reExport: /^\s*export\s*\{([^}]+)\}\s*from\s+['"]([^'"]+)['"]/,
  namedListExport: /^\s*export\s*\{([^}]+)\}(?!\s*from)/,
  defaultExport: /^\s*export\s+default\s+(?:async\s+)?(?:function|class)\s+(\w+)|^\s*export\s+default\s+(\w+)/,
  arrowFunctionExport: /^\s*export\s+(const|let|var)\s+(\w+)\s*[:=]\s*(?:async\s*)?\(/,
};

const DOC_COMMENT_PATTERN = /\/\*\*\s*([\s\S]*?)\s*\*\//;

export async function extractExportsFromFile(
  filePath: string,
  root: string
): Promise<ExportInfo[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const exports: ExportInfo[] = [];
    const seenNames = new Set<string>();
    let lastComment: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('/**')) {
        const commentEnd = lines.slice(i).findIndex(l => l.includes('*/'));
        if (commentEnd !== -1) {
          const commentLines = lines.slice(i, i + commentEnd + 1);
          const commentMatch = commentLines.join('\n').match(DOC_COMMENT_PATTERN);
          if (commentMatch) {
            lastComment = commentMatch[1]
              .split('\n')
              .map(l => l.replace(/^\s*\*\s?/, '').trim())
              .filter(l => l && !l.startsWith('@'))
              .join(' ')
              .slice(0, 120);
          }
          i += commentEnd;
          continue;
        }
      }

      if (!trimmedLine.startsWith('export')) {
        continue;
      }

      const lineExports = parseExportLine(trimmedLine, filePath, root, lastComment);
      for (const exp of lineExports) {
        if (!seenNames.has(exp.name)) {
          seenNames.add(exp.name);
          exports.push(exp);
        }
      }
      lastComment = undefined;
    }

    return exports;
  } catch {
    return [];
  }
}

function parseExportLine(
  line: string,
  filePath: string,
  root: string,
  description?: string
): ExportInfo[] {
  const exports: ExportInfo[] = [];

  const reExportMatch = line.match(EXPORT_PATTERNS.reExport);
  if (reExportMatch) {
    const names = parseExportList(reExportMatch[1]);
    for (const name of names) {
      exports.push({
        name,
        type: 'unknown',
        path: relative(root, filePath),
        isDefault: false,
        description,
      });
    }
    return exports;
  }

  const namedListMatch = line.match(EXPORT_PATTERNS.namedListExport);
  if (namedListMatch) {
    const names = parseExportList(namedListMatch[1]);
    for (const name of names) {
      exports.push({
        name,
        type: 'unknown',
        path: relative(root, filePath),
        isDefault: false,
        description,
      });
    }
    return exports;
  }

  const defaultMatch = line.match(EXPORT_PATTERNS.defaultExport);
  if (defaultMatch) {
    const name = defaultMatch[1] || defaultMatch[2];
    if (name) {
      exports.push({
        name,
        type: inferExportType(line),
        path: relative(root, filePath),
        isDefault: true,
        description,
      });
    }
    return exports;
  }

  const namedMatch = line.match(EXPORT_PATTERNS.namedExport);
  if (namedMatch) {
    const exportType = namedMatch[1];
    const name = namedMatch[2];
    
    if (exportType === 'const' || exportType === 'let' || exportType === 'var') {
      const arrowMatch = line.match(EXPORT_PATTERNS.arrowFunctionExport);
      if (arrowMatch) {
        exports.push({
          name: arrowMatch[2],
          type: 'function',
          path: relative(root, filePath),
          isDefault: false,
          description,
        });
        return exports;
      }
    }
    
    exports.push({
      name,
      type: exportType as ExportInfo['type'],
      path: relative(root, filePath),
      isDefault: false,
      description,
    });
    return exports;
  }

  return exports;
}

function parseExportList(listContent: string): string[] {
  return listContent
    .split(',')
    .map(n => n.trim())
    .filter(n => n)
    .map(n => {
      const asMatch = n.match(/^(\w+)\s+as\s+(\w+)$/);
      if (asMatch) {
        return asMatch[2];
      }
      return n;
    });
}

function inferExportType(line: string): ExportInfo['type'] {
  if (line.includes('function')) return 'function';
  if (line.includes('class')) return 'class';
  if (line.includes('interface')) return 'interface';
  if (line.includes('type ')) return 'type';
  if (line.includes('enum')) return 'enum';
  if (line.includes('const')) return 'const';
  if (line.includes('let') || line.includes('var')) return 'variable';
  return 'unknown';
}

export async function extractModuleExports(
  modulePath: string,
  root: string
): Promise<ExportInfo[]> {
  const { glob } = await import('fast-glob');
  
  const files = await glob(['**/*.{ts,tsx,js,jsx}'], {
    cwd: modulePath,
    onlyFiles: true,
    ignore: ['*.test.*', '*.spec.*', '__tests__/**', 'node_modules/**'],
  });

  const allExports: ExportInfo[] = [];
  const batchSize = 10;

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchExports = await Promise.all(
      batch.map(file => extractExportsFromFile(join(modulePath, file), root))
    );
    allExports.push(...batchExports.flat());
  }

  const exportMap = new Map<string, ExportInfo>();
  for (const exp of allExports) {
    const existing = exportMap.get(exp.name);
    if (!existing || (existing.type === 'unknown' && exp.type !== 'unknown')) {
      exportMap.set(exp.name, exp);
    }
  }

  return Array.from(exportMap.values());
}
