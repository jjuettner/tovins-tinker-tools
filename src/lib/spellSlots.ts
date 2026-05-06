import raw from "@/data/spell-slots.json";
import type { DndClass } from "@/lib/dndData";

type SlotRow = Record<string, number> & { level: number };

type SpellSlotsFile = {
  full_casters: { classes: string[]; slots_per_level: SlotRow[] };
  half_casters: { classes: string[]; slots_per_level: SlotRow[] };
  pact_magic: { classes: string[]; slots_per_level: { level: number; slots: number; slot_level: number }[] };
};

const data = raw as unknown as SpellSlotsFile;

const SPELL_LEVEL_KEYS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"] as const;

export type SpellSlotMaxima =
  | { kind: "none" }
  | { kind: "standard"; maxBySpellLevel: Record<number, number> }
  | { kind: "pact"; max: number; slotSpellLevel: number };

/**
 * Convert a per-level slot row to a map keyed by spell level (1-9).
 *
 * @param row Slot row from JSON.
 * @returns Max slots by spell level.
 */
function rowToMaxBySpellLevel(row: SlotRow): Record<number, number> {
  const out: Record<number, number> = {};
  SPELL_LEVEL_KEYS.forEach((k, i) => {
    const n = row[k];
    if (typeof n === "number" && n > 0) out[i + 1] = n;
  });
  return out;
}

/**
 * Find a standard (full/half caster) slot row for the given character level.
 *
 * @param rows Slot rows.
 * @param charLevel Character level (clamped to 1-20).
 * @returns Matching row, or undefined.
 */
function findStandardRow(rows: SlotRow[], charLevel: number): SlotRow | undefined {
  const lv = Math.min(20, Math.max(1, Math.floor(charLevel)));
  return rows.find((r) => r.level === lv);
}

/**
 * Compute maximum spell slots for a class at the given character level.
 *
 * @param dndClass SRD class (optional).
 * @param charLevel Character level.
 * @returns Slot maxima description (none/standard/pact).
 */
export function spellSlotMaximaForClass(dndClass: DndClass | undefined, charLevel: number): SpellSlotMaxima {
  if (!dndClass) return { kind: "none" };
  const name = dndClass.name.trim();
  const lv = Math.min(20, Math.max(1, Math.floor(charLevel)));

  if (data.pact_magic.classes.includes(name)) {
    const row = data.pact_magic.slots_per_level.find((r) => r.level === lv);
    if (!row) return { kind: "none" };
    return { kind: "pact", max: row.slots, slotSpellLevel: row.slot_level };
  }

  if (data.full_casters.classes.includes(name)) {
    const row = findStandardRow(data.full_casters.slots_per_level, lv);
    if (!row) return { kind: "none" };
    return { kind: "standard", maxBySpellLevel: rowToMaxBySpellLevel(row) };
  }

  if (data.half_casters.classes.includes(name)) {
    const row = findStandardRow(data.half_casters.slots_per_level, lv);
    if (!row) return { kind: "none" };
    return { kind: "standard", maxBySpellLevel: rowToMaxBySpellLevel(row) };
  }

  return { kind: "none" };
}

/**
 * Create an empty "used spell slots" map.
 *
 * @returns Empty map.
 */
export function emptySpellSlotsUsed(): Record<string, number> {
  return {};
}

/**
 * Compute remaining spell slots per spell level.
 *
 * For pact magic, only `slotSpellLevel` has a pool.
 *
 * @param maxima Maxima definition.
 * @param used Used slots keyed by spell level.
 * @returns Rows for UI (spellLevel/remaining/max).
 */
export function computeSpellSlotsRemaining(
  maxima: SpellSlotMaxima,
  used: Partial<Record<string, number>> | undefined
): { spellLevel: number; remaining: number; max: number }[] {
  const u = used ?? {};
  if (maxima.kind === "none") return [];

  if (maxima.kind === "pact") {
    const key = String(maxima.slotSpellLevel);
    const spent = u[key] ?? 0;
    return [{ spellLevel: maxima.slotSpellLevel, remaining: Math.max(0, maxima.max - spent), max: maxima.max }];
  }

  const rows: { spellLevel: number; remaining: number; max: number }[] = [];
  for (let sl = 1; sl <= 9; sl++) {
    const max = maxima.maxBySpellLevel[sl] ?? 0;
    if (max <= 0) continue;
    const spent = u[String(sl)] ?? 0;
    rows.push({ spellLevel: sl, remaining: Math.max(0, max - spent), max });
  }
  return rows;
}

/**
 * Find the highest available slot level usable to cast a spell of `spellLevel`.
 *
 * @param spellLevel Spell level to cast.
 * @param maxima Max slot definition.
 * @returns Highest usable slot level, or 0 if none.
 */
export function maxSpellSlotForSpell(spellLevel: number, maxima: SpellSlotMaxima): number {
  if (spellLevel <= 0) return 0;
  if (maxima.kind === "none") return 0;
  if (maxima.kind === "pact") {
    return maxima.slotSpellLevel >= spellLevel ? maxima.slotSpellLevel : 0;
  }
  let hi = 0;
  for (let sl = spellLevel; sl <= 9; sl++) {
    if ((maxima.maxBySpellLevel[sl] ?? 0) > 0) hi = sl;
  }
  return hi;
}
