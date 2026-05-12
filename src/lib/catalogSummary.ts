/**
 * Prefer catalog `summary` for compact play UI; otherwise use fallback prose.
 *
 * @param summary Optional DB `summary` column.
 * @param fallback Full description or narrative when summary is empty.
 * @returns Trimmed summary if set, else trimmed fallback.
 */
export function catalogSummaryOrFallback(summary: string | null | undefined, fallback: string): string {
  const s = typeof summary === "string" ? summary.trim() : "";
  if (s.length > 0) return s;
  return fallback.trim();
}
