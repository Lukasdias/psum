import type { ProjectSummary } from '../types.js'

export function formatMermaid(summary: ProjectSummary): string {
  const lines: string[] = []

  lines.push('```mermaid')
  lines.push('graph LR')
  lines.push('')

  const circularNodes = new Set<string>()
  const circularEdges = new Set<string>()
  for (const cycle of summary.dependencies.circular) {
    for (let i = 0; i < cycle.path.length - 1; i++) {
      circularNodes.add(cycle.path[i])
      circularEdges.add(`${cycle.path[i]}->${cycle.path[i + 1]}`)
    }
  }

  const moduleGroups = groupModulesByDirectory(summary.modules)

  lines.push('    %% Node styles')
  lines.push('    classDef entryPoint fill:#4f46e5,stroke:#312e81,stroke-width:2px,color:#fff')
  lines.push('    classDef module fill:#f3f4f6,stroke:#6b7280,stroke-width:1px')
  lines.push('    classDef circular fill:#fef3c7,stroke:#f59e0b,stroke-width:2px')
  lines.push('    classDef noExports fill:#e5e7eb,stroke:#9ca3af,stroke-dasharray: 5 5')
  lines.push('')

  let hasSubgraphs = false
  for (const [dir, modules] of moduleGroups) {
    if (dir && modules.length > 0) {
      lines.push(`    subgraph ${sanitizeNodeId(dir)}["📁 ${dir}"]`)
      for (const mod of modules) {
        const nodeId = sanitizeNodeId(mod.name)
        const nodeClass = getNodeClass(mod, circularNodes)
        lines.push(`        ${nodeId}["${mod.name}"]`)
        if (nodeClass) {
          lines.push(`        class ${nodeId} ${nodeClass}`)
        }
      }
      lines.push('    end')
      hasSubgraphs = true
    }
  }

  if (hasSubgraphs) {
    lines.push('')
  }

  const rootModules = summary.modules.filter(m => !m.path.includes('/'))
  for (const mod of rootModules) {
    const nodeId = sanitizeNodeId(mod.name)
    const nodeClass = getNodeClass(mod, circularNodes)
    lines.push(`    ${nodeId}["${mod.name}"]`)
    if (nodeClass) {
      lines.push(`    class ${nodeId} ${nodeClass}`)
    }
  }

  if (rootModules.length > 0) {
    lines.push('')
  }

  if (summary.entryPoints.length > 0) {
    const uniqueEntryPoints = new Map<string, string>()
    for (const ep of summary.entryPoints) {
      const name = ep.path.split('/').pop() || ep.path
      uniqueEntryPoints.set(name, ep.type)
    }
    
    lines.push('    subgraph EntryPoints["🚀 Entry Points"]')
    for (const [name, type] of uniqueEntryPoints) {
      const nodeId = `EP_${sanitizeNodeId(name)}`
      lines.push(`        ${nodeId}(["${name}"])`)
      lines.push(`        class ${nodeId} entryPoint`)
    }
    lines.push('    end')
    lines.push('')
  }

  const validEdges = summary.dependencies.edges
    .filter(e => e.from !== e.to)
    .slice(0, 50)

  if (validEdges.length > 0) {
    lines.push('    %% Dependencies')
    for (const edge of validEdges) {
      const from = sanitizeNodeId(edge.from)
      const to = sanitizeNodeId(edge.to)
      const edgeKey = `${edge.from}->${edge.to}`
      const isCircular = circularEdges.has(edgeKey)
      const style = isCircular ? ' -->|' : ' --> '
      const suffix = isCircular ? '|' : ''
      lines.push(`    ${from}${style}${to}${suffix}`)
    }
    if (summary.dependencies.edges.length > 50) {
      lines.push(`    note "... and ${summary.dependencies.edges.length - 50} more edges"`)
    }
    lines.push('')
  }

  if (summary.dependencies.circular.length > 0) {
    lines.push('    %% Circular dependencies detected')
    for (let i = 0; i < summary.dependencies.circular.length; i++) {
      const cycle = summary.dependencies.circular[i]
      const cycleStr = cycle.path.join(' → ')
      lines.push(`    note right of ${sanitizeNodeId(cycle.path[0])} "⚠️ Cycle ${i + 1}: ${cycleStr}"`)
    }
    lines.push('')
  }

  lines.push('```')

  return lines.join('\n')
}

function groupModulesByDirectory(modules: ProjectSummary['modules']): Map<string, ProjectSummary['modules']> {
  const groups = new Map<string, ProjectSummary['modules']>()
  
  for (const mod of modules) {
    const dir = mod.path.split('/')[0]
    if (!groups.has(dir)) {
      groups.set(dir, [])
    }
    groups.get(dir)!.push(mod)
  }

  return groups
}

function getNodeClass(
  mod: ProjectSummary['modules'][0],
  circularNodes: Set<string>
): string | null {
  if (circularNodes.has(mod.name)) {
    return 'circular'
  }
  if (mod.exports.length === 0) {
    return 'noExports'
  }
  return 'module'
}

function sanitizeNodeId(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/^[0-9]/, '_$&')
}
