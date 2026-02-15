import type { ProjectSummary, ExportInfo } from '../types.js';

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

      if (mod.exports.length > 0) {
        lines.push('');
        lines.push('#### Public API');
        lines.push('');
        const exportsByType = groupExportsByType(mod.exports);
        for (const [type, exports] of Object.entries(exportsByType)) {
          if (exports.length > 0) {
            lines.push(`**${capitalize(type)}s**: ${exports.length}`);
            for (const exp of exports.slice(0, 10)) {
              const defaultMarker = exp.isDefault ? ' (default)' : '';
              const desc = exp.description ? ` - ${exp.description}` : '';
              lines.push(`- \`${exp.name}\`${defaultMarker}${desc}`);
            }
            if (exports.length > 10) {
              lines.push(`- *... and ${exports.length - 10} more*`);
            }
            lines.push('');
          }
        }
      }

      lines.push('');
    }
  }

  if (summary.dependencies.circular.length > 0) {
    lines.push('## Circular Dependencies');
    lines.push('');
    lines.push(`⚠️ Found ${summary.dependencies.circular.length} circular dependency chain(s):`);
    lines.push('');
    for (const cycle of summary.dependencies.circular) {
      lines.push(`**Length ${cycle.length}**: ${cycle.path.join(' → ')}`);
    }
    lines.push('');
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

function groupExportsByType(exports: ExportInfo[]): Record<string, ExportInfo[]> {
  const groups: Record<string, ExportInfo[]> = {};
  for (const exp of exports) {
    if (!groups[exp.type]) {
      groups[exp.type] = [];
    }
    groups[exp.type].push(exp);
  }
  return groups;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}