import type { Module } from '../types.js';
import { extractModuleExports } from './exports.js';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const SOURCE_DIRS = ['src', 'lib', 'app', 'packages', 'core', 'modules'];

export async function detectModules(root: string, depth: number = 2): Promise<Module[]> {
  const modules: Module[] = [];
  const scannedPaths = new Set<string>();

  for (const dir of SOURCE_DIRS) {
    const fullPath = join(root, dir);
    try {
      const stats = await stat(fullPath);
      if (stats.isDirectory()) {
        const subdirs = await scanDirectory(fullPath, root, depth, scannedPaths);
        modules.push(...subdirs);
      }
    } catch {
    }
  }

  for (const module of modules) {
    const moduleFullPath = join(root, module.path);
    try {
      const stats = await stat(moduleFullPath);
      if (stats.isDirectory()) {
        module.exports = await extractModuleExports(moduleFullPath, root);
      }
    } catch {
    }
  }

  return modules;
}

async function scanDirectory(
  dirPath: string,
  root: string,
  maxDepth: number,
  scanned: Set<string>,
  currentDepth: number = 0
): Promise<Module[]> {
  if (currentDepth >= maxDepth || scanned.has(dirPath)) {
    return [];
  }

  scanned.add(dirPath);
  const modules: Module[] = [];

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const subPath = join(dirPath, entry.name);
        const relativePath = subPath.replace(root + '/', '').replace(root, '');

        const fileCount = await countFiles(subPath);

        modules.push({
          name: entry.name,
          path: relativePath || entry.name,
          files: fileCount,
          dependencies: [],
          exports: [],
        });

        const subModules = await scanDirectory(subPath, root, maxDepth, scanned, currentDepth + 1);
        modules.push(...subModules);
      }
    }
  } catch {
  }

  return modules;
}

async function countFiles(dirPath: string): Promise<number> {
  let count = 0;
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && !entry.name.startsWith('.')) {
        count++;
      }
    }
  } catch {
  }
  return count;
}