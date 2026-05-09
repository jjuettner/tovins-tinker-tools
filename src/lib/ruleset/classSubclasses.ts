export type DndSubclassOption = {
  index: string;
  name: string;
};

/**
 * Parse `subclasses` from a ruleset class row `data` blob (seeded PHB class JSON).
 *
 * @param data JSON from `public.classes.data`.
 * @returns Sorted by name; empty array becomes `undefined` (caller treats as no subclasses).
 */
export function subclassesFromClassData(data: unknown): DndSubclassOption[] | undefined {
  if (!data || typeof data !== "object") return undefined;
  const raw = (data as Record<string, unknown>).subclasses;
  if (!Array.isArray(raw)) return undefined;
  const out: DndSubclassOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const index = typeof o.index === "string" ? o.index.trim() : "";
    const name = typeof o.name === "string" ? o.name.trim() : "";
    if (!index) continue;
    out.push({ index, name: name || index });
  }
  if (out.length === 0) return undefined;
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
