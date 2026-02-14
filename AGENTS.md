# psum - Project Structure Summarizer

## Project Overview

A fast, lightweight CLI tool for generating AI-optimized codebase summaries. Built with Bun and TypeScript.

## Build Commands

```bash
# Development - run directly with Bun
bun run src/cli.ts
bun run dev

# Type checking
bun run typecheck

# Build for production (creates dist/cli.js)
bun run build

# Compile to standalone binary
bun run compile
```

## Code Style Guidelines

### Imports

**Order matters - always follow this sequence:**

1. Type imports first
2. External dependencies (commander, picocolors, etc.)
3. Internal modules from other directories
4. Internal modules from same directory
5. Node.js built-ins with `node:` prefix last

```typescript
import type { EntryPoint } from '../types.js';
import { Command } from 'commander';
import pc from 'picocolors';
import { scanProject } from './scanner/index.js';
import { readFile } from 'node:fs/promises';
```

**Always use `.js` extensions** for TypeScript imports (ESM requirement).

### Types & Naming

- Use strict TypeScript - **no `any` types**
- Interfaces/types: **PascalCase** (`EntryPoint`, `ScanOptions`)
- Functions/variables: **camelCase** (`detectEntryPoints`, `totalFiles`)
- Constants: **SCREAMING_SNAKE_CASE** for true constants
- Boolean variables should answer yes/no questions (`isCached`, `hasError`)

### Error Handling

Use empty catch blocks for optional operations that might fail:

```typescript
try {
  const content = await readFile(path, 'utf-8');
  return JSON.parse(content);
} catch {
  // File doesn't exist or is invalid - return default
  return defaultValue;
}
```

For critical errors, propagate them to the CLI layer for proper handling.

### Performance

- **Lazy load** heavy operations with dynamic imports
- Process files in **batches** (50 at a time) to avoid overwhelming the event loop
- Use `Promise.all()` for parallel independent operations
- Prefer streaming for large file operations

```typescript
// Lazy load
const { glob } = await import('fast-glob');

// Batch processing
const batchSize = 50;
for (let i = 0; i < files.length; i += batchSize) {
  const batch = files.slice(i, i + batchSize);
  await Promise.all(batch.map(processFile));
}
```

### Formatting

- No semicolons (Bun/TS handles ASI)
- Trailing commas in multi-line objects/arrays
- Single quotes for strings
- 2 spaces indentation
- Max line length: 100 characters

### Comments

**Minimize comments** - code should be self-documenting. Only add comments for:
- Complex algorithms or regex patterns
- Non-obvious performance optimizations
- Security considerations

### File Structure

```
src/
├── feature/
│   ├── index.ts          # Public exports
│   ├── specific-module.ts
│   └── utils.ts
├── types.ts              # Shared types/interfaces
└── cli.ts                # Entry point
```

### Exports

Prefer **named exports** over default exports:

```typescript
// Good
export { formatJSON, formatMarkdown } from './formatters/index.js';

// Avoid
export default function format() { }
```

### Testing (When Added)

```bash
# Run all tests
bun test

# Run single test file
bun test src/scanner/entry-points.test.ts

# Run tests matching pattern
bun test --grep "detectEntryPoints"
```

## Dependencies

- **Runtime**: commander, fast-glob, picocolors, zod
- **Dev**: @types/node, @types/bun
- **Engine**: Bun >= 1.0.0

Always prefer Node.js built-ins over external packages when possible.

## CLI Usage Examples

```bash
# Scan current directory
./dist/cli.js .

# Output formats
./dist/cli.js . --format json
./dist/cli.js . --format ascii
./dist/cli.js . --format mermaid

# With options
./dist/cli.js . --depth 2 --no-tests --cache
```
