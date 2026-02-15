export interface EntryPoint {
  path: string;
  type: 'cli' | 'server' | 'client' | 'library' | 'config' | 'unknown';
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'variable' | 'enum' | 'unknown';
  path: string;
  isDefault: boolean;
  description?: string;
}

export interface Module {
  name: string;
  path: string;
  files: number;
  dependencies: string[];
  exports: ExportInfo[];
}

export interface DependencyEdge {
  from: string;
  to: string;
}

export interface CircularDependency {
  path: string[];
  length: number;
}

export interface DependencyGraph {
  nodes: string[];
  edges: DependencyEdge[];
  circular: CircularDependency[];
}

export interface LanguageStats {
  [language: string]: number;
}

export interface ProjectSummary {
  name: string;
  root: string;
  type: 'typescript' | 'javascript' | 'python' | 'rust' | 'go' | 'mixed' | 'unknown';
  entryPoints: EntryPoint[];
  modules: Module[];
  dependencies: DependencyGraph;
  stats: {
    totalFiles: number;
    totalLines: number;
    languages: LanguageStats;
  };
  configFiles: string[];
  generatedAt: string;
}

export interface ScanOptions {
  depth?: number;
  includeTests?: boolean;
  includeDeps?: boolean;
  excludePatterns?: string[];
}

export interface CacheEntry {
  summary: ProjectSummary;
  mtime: number;
  configHash: string;
}