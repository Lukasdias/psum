import type { ProjectSummary } from '../types.js';

export function formatJSON(summary: ProjectSummary): string {
  return JSON.stringify(summary, null, 2);
}