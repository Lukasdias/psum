# psum

A CLI tool for generating structured codebase summaries. Built with Bun and TypeScript.

## Overview

Scans project directories and outputs architecture overviews including entry points, modules, dependencies, and statistics. Designed for programmatic use and integration with development workflows.

## Installation

```bash
git clone https://github.com/yourusername/psum.git
cd psum
bun install
bun run build
```

## Usage

```bash
# Scan current directory
psum

# Scan specific path
psum ./my-project

# Output formats
psum --format json      # Machine-readable JSON
psum --format md        # Markdown (default)
psum --format ascii     # Terminal tree view
psum --format mermaid   # Dependency graph

# Options
psum --depth 2          # Limit directory depth
psum --no-tests         # Exclude test files
psum --cache            # Enable result caching
psum --ai-context       # Truncate for LLM context windows
psum --tokens 4000      # Enforce token limit
```

## Output Examples

**Markdown:**
```markdown
# project-name

**Type**: typescript
**Files**: 45 | **Lines**: 3,240

## Entry Points
- src/cli.ts (cli)
- src/server.ts (server)

## Modules
- auth/ (12 files) - deps: db, utils
- api/ (8 files) - deps: auth
```

**JSON:**
```json
{
  "name": "project-name",
  "type": "typescript",
  "entryPoints": [...],
  "modules": [...],
  "stats": { "totalFiles": 45, "totalLines": 3240 }
}
```

**ASCII:**
```
project-name
============
Type: typescript | Files: 45 | Lines: 3,240

Structure:
└── src/
    ├── auth/ (12 files)
    ├── api/ (8 files)
    └── db/ (6 files)
```

## Development

```bash
bun run dev        # Run in development
bun run typecheck  # Type checking
bun run build      # Build to dist/
bun run compile    # Create standalone binary
```

## Architecture

```
src/
├── scanner/       # File system scanning
├── analyzer/      # Dependency analysis
├── formatters/    # Output generators
├── cache.ts       # Result caching
└── cli.ts         # CLI interface
```

## Dependencies

- commander - CLI argument parsing
- fast-glob - File globbing
- picocolors - Terminal colors
- zod - Schema validation

Requires Bun >= 1.0.0

## License

MIT
