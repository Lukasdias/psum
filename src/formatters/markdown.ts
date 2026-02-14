import type { ProjectSummary } from '../types.js';

export function formatMarkdown(summary: ProjectSummary): string {
  const lines: string[] = [];

  lines.push(`# ${summary.name}`);
  lines.push('');
  lines.push(`**Type**: ${summary.type}`);
  lines.push(`**Root**: \`${summary.root}\``);
  lines.push(`**Generated**: ${summary.generatedAt}`);
  lines.push('');

  if (summary.entryPoints.length > 0) {
    lines.push('## Entry Points');
    lines.push('');
    for (const ep of summary.entryPoints) {
      lines.push(`- \`${ep.path}\` (${ep.type})`);
    }
    lines.push('');
  }

  if (summary.modules.length > 0) {
    lines.push('## Modules');
    lines.push('');
    for (const mod of summary.modules) {
      lines.push(`### ${mod.name}`);
      lines.push(`- Path: \`${mod.path}\``);
      lines.push(`- Files: ${mod.files}`);
      if (mod.dependencies.length > 0) {
        lines.push(`- Dependencies: ${mod.dependencies.join(', ')}`);
      }
      lines.push('');
    }
  }

  if (summary.dependencies.edges.length > 0) {
    lines.push('## Dependency Graph');
    lines.push('');
    lines.push('```');
    for (const edge of summary.dependencies.edges) {
      lines.push(`${edge.from} → ${edge.to}`);
    }
    lines.push('```');
    lines.push('');
  }

  lines.push('## Statistics');
  lines.push('');
  lines.push(`- **Total Files**: ${summary.stats.totalFiles}`);
  lines.push(`- **Total Lines**: ${summary.stats.totalLines.toLocaleString()}`);
  lines.push('');

  if (Object.keys(summary.stats.languages).length > 0) {
    lines.push('### Languages');
    lines.push('');
    const sorted = Object.entries(summary.stats.languages).sort((a, b) => b[1] - a[1]);
    for (const [lang, count] of sorted.slice(0, 10)) {
      lines.push(`- ${lang}: ${count}`);
    }
    lines.push('');
  }

  if (summary.configFiles.length > 0) {
    lines.push('## Configuration Files');
    lines.push('');
    for (const file of summary.configFiles) {
      lines.push(`- \`${file}\``);
    }
    lines.push('');
  }

  return lines.join('\n');
}