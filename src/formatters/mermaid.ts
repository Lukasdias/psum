import type { ProjectSummary } from '../types.js';

export function formatMermaid(summary: ProjectSummary): string {
  const lines: string[] = [];

  lines.push('```mermaid');
  lines.push('graph TD');
  lines.push('');

  if (summary.modules.length > 0) {
    for (const mod of summary.modules) {
      const nodeId = sanitizeNodeId(mod.name);
      lines.push(`    ${nodeId}["${mod.name}"]`);
    }
    lines.push('');

    for (const edge of summary.dependencies.edges) {
      const from = sanitizeNodeId(edge.from);
      const to = sanitizeNodeId(edge.to);
      lines.push(`    ${from} --> ${to}`);
    }
  }

  if (summary.entryPoints.length > 0) {
    lines.push('');
    lines.push('    subgraph EntryPoints');
    for (const ep of summary.entryPoints) {
      const name = ep.path.split('/').pop() || ep.path;
      const nodeId = `EP_${sanitizeNodeId(name)}`;
      lines.push(`        ${nodeId}["${name}"]`);
    }
    lines.push('    end');
  }

  lines.push('```');

  return lines.join('\n');
}

function sanitizeNodeId(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/^[0-9]/, '_$&');
}