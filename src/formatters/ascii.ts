import type { ProjectSummary } from '../types.js';

export function formatASCII(summary: ProjectSummary): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(`  ${summary.name}`);
  lines.push(`  ${'='.repeat(summary.name.length)}`);
  lines.push(`  Type: ${summary.type} | Files: ${summary.stats.totalFiles} | Lines: ${summary.stats.totalLines.toLocaleString()}`);
  lines.push('');

  if (summary.entryPoints.length > 0) {
    lines.push('  Entry Points:');
    for (const ep of summary.entryPoints) {
      const icon = getIconForType(ep.type);
      lines.push(`  ${icon} ${ep.path}`);
    }
    lines.push('');
  }

  if (summary.modules.length > 0) {
    lines.push('  Structure:');
    const tree = buildTree(summary.modules);
    for (const line of tree) {
      lines.push(`  ${line}`);
    }
    lines.push('');
  }

  const topLangs = Object.entries(summary.stats.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topLangs.length > 0) {
    lines.push('  Languages:');
    for (const [lang, count] of topLangs) {
      const bar = '█'.repeat(Math.min(count, 20));
      lines.push(`    ${lang.padEnd(12)} ${bar} ${count}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function getIconForType(type: string): string {
  const icons: Record<string, string> = {
    cli: '▶',
    server: '◉',
    client: '◈',
    library: '◇',
    config: '⚙',
    unknown: '•',
  };
  return icons[type] || '•';
}

function buildTree(modules: ProjectSummary['modules']): string[] {
  const lines: string[] = [];

  const grouped = modules.reduce((acc, mod) => {
    const topLevel = mod.path.split('/')[0];
    if (!acc[topLevel]) acc[topLevel] = [];
    acc[topLevel].push(mod);
    return acc;
  }, {} as Record<string, typeof modules>);

  const entries = Object.entries(grouped);
  for (let i = 0; i < entries.length; i++) {
    const [name, mods] = entries[i];
    const isLast = i === entries.length - 1;
    const prefix = isLast ? '└──' : '├──';

    lines.push(`${prefix} ${name}/ (${mods.length} modules)`);

    const sorted = mods.sort((a, b) => a.path.localeCompare(b.path));
    for (let j = 0; j < sorted.length; j++) {
      const mod = sorted[j];
      const isLastMod = j === sorted.length - 1;
      const subPrefix = isLast ? '    ' : '│   ';
      const modPrefix = isLastMod ? '└──' : '├──';

      lines.push(`${subPrefix}${modPrefix} ${mod.name}/ (${mod.files} files)`);
    }
  }

  return lines;
}