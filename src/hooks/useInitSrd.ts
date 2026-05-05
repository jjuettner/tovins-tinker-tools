import { useEffect, useState } from "react";
import { DND2024_RULESET_ID } from "../lib/db/rulesets";
import { fetchClasses, fetchClassSpellSlots, fetchEquipment, fetchFeats, fetchRaces, fetchSpells, fetchWeaponMastery } from "../lib/db/srd";
import { setSrdState } from "../lib/srdState";

export function useInitSrd() {
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
        setSrdState({ spells, classes, races, feats, equipment, weaponMastery, classSpellSlots });
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load SRD");
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

