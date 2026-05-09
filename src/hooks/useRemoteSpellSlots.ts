import { useEffect, useMemo, useState } from "react";
import { fetchClassSpellSlots } from "@/lib/db/rulesetCatalog";
import type { SpellSlotMaxima } from "@/lib/spellSlots";

type SlotPayload =
  | { kind: "standard"; perSpellLevel: number[] }
  | { kind: "pact"; max: number; slotSpellLevel: number };

/**
 * Load class spell-slot progressions from remote ruleset catalog tables.
 *
 * @param rulesetIds Active rulesets.
 * @returns Loading state + resolver for maxima at (class, level).
 */
export function useRemoteSpellSlots(rulesetIds: string[]) {
  const [byClassLevel, setByClassLevel] = useState<Record<string, Record<number, SlotPayload>>>({});
  const [loading, setLoading] = useState(true);

  const key = useMemo(() => [...rulesetIds].sort().join(","), [rulesetIds]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const rows = await fetchClassSpellSlots(rulesetIds);
        if (cancelled) return;
        const next: Record<string, Record<number, SlotPayload>> = {};
        rows.forEach((r) => {
          const payload = r.slots as SlotPayload;
          if (!payload || typeof payload !== "object") return;
          if (!next[r.class_slug]) next[r.class_slug] = {};
          next[r.class_slug][r.level] = payload;
        });
        setByClassLevel(next);
        setLoading(false);
      } catch {
        if (cancelled) return;
        setByClassLevel({});
        setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [key, rulesetIds]);

  /**
   * Resolve maxima payload for a class at a specific level.
   *
   * @param classSlug Class slug.
   * @param level Character level.
   * @returns Slot maxima, or null if missing.
   */
  function maximaFor(classSlug: string, level: number): SpellSlotMaxima | null {
    const rows = byClassLevel[classSlug];
    if (!rows) return null;
    const payload = rows[level];
    if (!payload) return null;
    if (payload.kind === "pact") return payload;
    const maxBySpellLevel: Record<number, number> = {};
    payload.perSpellLevel.forEach((n, i) => {
      if (typeof n === "number" && n > 0) maxBySpellLevel[i + 1] = n;
    });
    return { kind: "standard", maxBySpellLevel };
  }

  return { loading, maximaFor } as const;
}

