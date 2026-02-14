#!/usr/bin/env bun

import { Command } from 'commander';
import pc from 'picocolors';
import { scanProject } from './scanner/index.js';
import { buildDependencyGraph } from './analyzer/index.js';
import { formatJSON, formatMarkdown, formatASCII, formatMermaid } from './formatters/index.js';
import { getCachedSummary, setCachedSummary } from './cache.js';
import type { ScanOptions } from './types.js';
import { glob } from 'fast-glob';
import { join } from 'node:path';

const program = new Command();

program
  .name('psum')
  .description('Project Structure Summarizer - Fast, AI-optimized codebase overview')
  .version('0.1.0');

program
  .argument('[path]', 'Project path to scan', '.')
  .option('-f, --format <type>', 'Output format: json, md, ascii, mermaid', 'md')
  .option('-d, --depth <number>', 'Directory scanning depth', '3')
  .option('--no-deps', 'Skip dependency analysis')
  .option('--no-tests', 'Exclude test files')
  .option('--cache', 'Use caching for faster repeated runs')
  .option('--ai-context', 'Optimize output for AI context windows')
  .option('--tokens <number>', 'Stay within token budget')
  .option('-o, --output <file>', 'Output to file instead of stdout')
  .action(async (projectPath, options) => {
    const startTime = performance.now();
    const root = join(process.cwd(), projectPath);

    try {
      const scanOptions: ScanOptions = {
        depth: parseInt(options.depth, 10),
        includeTests: options.tests,
        includeDeps: options.deps,
      };

      let summary;

      if (options.cache) {
        summary = await getCachedSummary(root, scanOptions);
        if (summary) {
          console.error(pc.dim('Using cached results...'));
        }
      }

      if (!summary) {
        summary = await scanProject(root, scanOptions);

        if (options.deps) {
          const { glob } = await import('fast-glob');
          const files = await glob(['**/*.{ts,js,tsx,jsx}'], {
            cwd: root,
            ignore: ['node_modules/**', 'dist/**', 'build/**'],
          });
          summary.dependencies = await buildDependencyGraph(files.slice(0, 100), root);
        }

        if (options.cache) {
          await setCachedSummary(root, summary, scanOptions);
        }
      }

      let output: string;

      switch (options.format) {
        case 'json':
          output = formatJSON(summary);
          break;
        case 'md':
        case 'markdown':
          output = formatMarkdown(summary);
          break;
        case 'ascii':
          output = formatASCII(summary);
          break;
        case 'mermaid':
          output = formatMermaid(summary);
          break;
        default:
          console.error(pc.red(`Unknown format: ${options.format}`));
          process.exit(1);
      }

      if (options.aiContext) {
        output = optimizeForAI(output, options.tokens ? parseInt(options.tokens, 10) : undefined);
      }

      if (options.output) {
        const { writeFile } = await import('node:fs/promises');
        await writeFile(options.output, output);
        console.error(pc.green(`Output written to ${options.output}`));
      } else {
        console.log(output);
      }

      const duration = (performance.now() - startTime).toFixed(0);
      console.error(pc.dim(`Scanned in ${duration}ms`));

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(pc.red(`Error: ${message}`));
      process.exit(1);
    }
  });

function optimizeForAI(content: string, maxTokens?: number): string {
  const lines = content.split('\n');
  const optimized: string[] = [];
  let tokenCount = 0;

  const approxTokens = (str: string) => Math.ceil(str.length / 4);

  for (const line of lines) {
    const lineTokens = approxTokens(line);

    if (maxTokens && tokenCount + lineTokens > maxTokens) {
      optimized.push('');
      optimized.push('*[truncated for token limit]*');
      break;
    }

    optimized.push(line);
    tokenCount += lineTokens;
  }

  return optimized.join('\n');
}

program.parse();