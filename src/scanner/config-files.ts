import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { LanguageStats } from '../types.js';

const CONFIG_PATTERNS = [
  'package.json',
  'tsconfig.json',
  'jsconfig.json',
  'vite.config.{ts,js}',
  'webpack.config.{ts,js}',
  'rollup.config.{ts,js}',
  'esbuild.config.{ts,js}',
  'next.config.{ts,js}',
  'svelte.config.{ts,js}',
  'astro.config.{ts,js}',
  'tailwind.config.{ts,js}',
  'postcss.config.{ts,js}',
  'jest.config.{ts,js}',
  'vitest.config.{ts,js}',
  'playwright.config.{ts,js}',
  'cypress.config.{ts,js}',
  '.eslintrc.{js,json}',
  '.prettierrc',
  'Cargo.toml',
  'go.mod',
  'requirements.txt',
  'pyproject.toml',
  'setup.py',
  'Dockerfile',
  'docker-compose.yml',
  '.github/workflows/*.yml',
  '.gitignore',
  '.npmrc',
  '.nvmrc',
];

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ts: 'TypeScript',
  tsx: 'TypeScript',
  js: 'JavaScript',
  jsx: 'JavaScript',
  mjs: 'JavaScript',
  cjs: 'JavaScript',
  py: 'Python',
  rs: 'Rust',
  go: 'Go',
  java: 'Java',
  rb: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kt: 'Kotlin',
  scala: 'Scala',
  cpp: 'C++',
  c: 'C',
  h: 'C/C++',
  hpp: 'C++',
  cs: 'C#',
  fs: 'F#',
  ex: 'Elixir',
  exs: 'Elixir',
  json: 'JSON',
  md: 'Markdown',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'SASS',
  less: 'LESS',
  sql: 'SQL',
  sh: 'Shell',
  bash: 'Shell',
  zsh: 'Shell',
};

export async function detectConfigFiles(root: string): Promise<string[]> {
  const configs: string[] = [];

  for (const pattern of CONFIG_PATTERNS) {
    if (pattern.includes('*')) {
      const [dir, ext] = pattern.split('/*');
      try {
        const files = await readdir(join(root, dir));
        for (const file of files) {
          if (file.endsWith(ext.replace('.', ''))) {
            configs.push(`${dir}/${file}`);
          }
        }
      } catch {
      }
    } else if (pattern.includes('{')) {
      const base = pattern.split('{')[0];
      const exts = pattern.match(/\{(.*)\}/)?.[1].split(',') || [];
      for (const ext of exts) {
        try {
          const fullPath = join(root, `${base}${ext}`);
          await readFile(fullPath);
          configs.push(`${base}${ext}`);
        } catch {
        }
      }
    } else {
      try {
        await readFile(join(root, pattern));
        configs.push(pattern);
      } catch {
      }
    }
  }

  return configs.sort();
}

export function getLanguageFromExtension(ext: string): string {
  return EXTENSION_TO_LANGUAGE[ext.toLowerCase()] || 'Unknown';
}