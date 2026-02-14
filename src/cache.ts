import type { ProjectSummary, CacheEntry, ScanOptions } from './types.js';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const CACHE_DIR = '.psum';
const CACHE_FILE = 'cache.json';

export async function getCachedSummary(
  root: string,
  options: ScanOptions
): Promise<ProjectSummary | null> {
  try {
    const cachePath = join(root, CACHE_DIR, CACHE_FILE);
    const content = await readFile(cachePath, 'utf-8');
    const cache: CacheEntry = JSON.parse(content);

    const configHash = hashConfig(options);
    if (cache.configHash !== configHash) {
      return null;
    }

    const stats = await stat(root);
    if (stats.mtimeMs > cache.mtime) {
      return null;
    }

    return cache.summary;
  } catch {
    return null;
  }
}

export async function setCachedSummary(
  root: string,
  summary: ProjectSummary,
  options: ScanOptions
): Promise<void> {
  try {
    const cacheDir = join(root, CACHE_DIR);
    await mkdir(cacheDir, { recursive: true });

    const cache: CacheEntry = {
      summary,
      mtime: Date.now(),
      configHash: hashConfig(options),
    };

    const cachePath = join(cacheDir, CACHE_FILE);
    await writeFile(cachePath, JSON.stringify(cache, null, 2));
  } catch {
  }
}

function hashConfig(options: ScanOptions): string {
  const str = JSON.stringify(options);
  return createHash('md5').update(str).digest('hex').slice(0, 8);
}