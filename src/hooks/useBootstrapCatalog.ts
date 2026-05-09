import { useEffect, useState } from "react";
import { setRulesetCatalogCache } from "@/lib/catalogCache";
import {
  fetchClasses,
  fetchClassSpellSlots,
  fetchEquipment,
  fetchFeats,
  fetchRaces,
  fetchSpells,
  fetchWeaponMastery
} from "@/lib/db/rulesetCatalog";
import { DND2024_RULESET_ID } from "@/lib/db/rulesets";

/**
 * Prefetch bundled default ruleset tables into shared in-memory cache.
 *
 * Loads ruleset catalog rows via Supabase once on mount for the builtin D&D 2024 ruleset.
 *
 * @returns Loading + error state.
 */
export function useBootstrapCatalog() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const rulesetIds = [DND2024_RULESET_ID];
        const [spells, classes, races, feats, equipment, weaponMastery, classSpellSlots] = await Promise.all([
          fetchSpells(rulesetIds),
          fetchClasses(rulesetIds),
          fetchRaces(rulesetIds),
          fetchFeats(rulesetIds),
          fetchEquipment(rulesetIds),
          fetchWeaponMastery(rulesetIds),
          fetchClassSpellSlots(rulesetIds)
        ]);
        if (cancelled) return;
        setRulesetCatalogCache({ spells, classes, races, feats, equipment, weaponMastery, classSpellSlots });
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load ruleset catalog");
        setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, error } as const;
}
