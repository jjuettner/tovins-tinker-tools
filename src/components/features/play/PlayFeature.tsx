import { X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buttonClass, inputClass, smallLabelClass } from "@/components/ui/controlClasses";
import CombatTab from "@/components/features/play/CombatTab";
import GeneralTab from "@/components/features/play/GeneralTab";
import PlayHeader from "@/components/features/play/PlayHeader";
import SpellsTab from "@/components/features/play/SpellsTab";
import { useActiveRulesetIds } from "@/hooks/useActiveRulesetIds";
import { useCharacters } from "@/hooks/useCharacters";
import { useRemoteSpellSlots } from "@/hooks/useRemoteSpellSlots";
import { useRulesetSrdCatalog } from "@/hooks/useRulesetSrdCatalog";
import { useStoredState } from "@/hooks/useStoredState";
import { normalizeCharacter } from "@/lib/character/normalize";
import { STORAGE_KEYS } from "@/lib/appConstants";
import { dndClassByIndex, dndFeatByIndex, dndSpellByIndex, type DndSpell } from "@/lib/dndData";
import { splitEquipped } from "@/lib/equippedLayout";
import { dndRaceByIndex } from "@/lib/dndRaces";
import { computeSpellSlotsRemaining, emptySpellSlotsUsed, spellSlotMaximaForClass } from "@/lib/spellSlots";
import type { Character } from "@/types/character";

type Tab = "general" | "combat" | "spells";

export function PlayFeature() {
  const { characters, save } = useCharacters();
  const { value: usedCharacterId } = useStoredState<string | null>(STORAGE_KEYS.usedCharacterId, null);
  const [tab, setTab] = useState<Tab>("general");
  const [restOpen, setRestOpen] = useState(false);

  const c = useMemo(
    () => (usedCharacterId ? characters.find((ch) => ch.id === usedCharacterId) : undefined),
    [characters, usedCharacterId]
  );

  const patch = useCallback(
    (id: string, fn: (x: Character) => Character) => {
      const current = characters.find((x) => x.id === id);
      if (!current) return;
      void save(normalizeCharacter(fn(current)));
    },
    [characters, save]
  );

  const { activeRuleIds } = useActiveRulesetIds(c?.campaignId ?? null);
  const catalog = useRulesetSrdCatalog(activeRuleIds);
  const { maximaFor } = useRemoteSpellSlots(activeRuleIds);

  const classByIndex = catalog.loading ? dndClassByIndex : catalog.classesByIndex;
  const spellByIndex = catalog.loading ? dndSpellByIndex : catalog.spellsByIndex;
  const cls = classByIndex[c?.classIndex ?? ""];

  const maxima = useMemo(() => {
    if (!c) return { kind: "none" as const };
    const remote = maximaFor(c.classIndex, c.level);
    if (remote) return remote;
    return spellSlotMaximaForClass(cls, c.level);
  }, [c, cls, maximaFor]);
  const slotRows = useMemo(() => (c ? computeSpellSlotsRemaining(maxima, c.spellSlotsUsed) : []), [maxima, c]);
  const preparedLeveled = useMemo(
    () =>
      c
        ? (c.spells ?? [])
            .map((idx) => spellByIndex[idx])
            .filter((s): s is DndSpell => Boolean(s && s.level > 0))
            .sort((a, b) => (a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name)))
        : [],
    [c, spellByIndex]
  );
  const cantrips = useMemo(
    () =>
      c
        ? (c.spells ?? [])
            .map((idx) => spellByIndex[idx])
            .filter((s): s is DndSpell => Boolean(s && s.level === 0))
            .sort((a, b) => a.name.localeCompare(b.name))
        : [],
    [c, spellByIndex]
  );
  const weapons = useMemo(
    () =>
      c
        ? splitEquipped(c.equipped).weapons.filter((w) => {
            return Boolean(w.equipmentIndex);
          })
        : [],
    [c]
  );

  const isCaster = useMemo(() => {
    if (!c) return false;
    const hasSlots = slotRows.length > 0;
    const knowsSpells = (c.spells ?? []).length > 0;
    return hasSlots && knowsSpells;
  }, [c, slotRows.length]);

  const effectiveTab: Tab = isCaster ? tab : tab === "spells" ? "general" : tab;

  if (!usedCharacterId || !c) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white/70 p-8 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h1 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-50">Play</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          On Characters, select someone in the list, then use <span className="font-medium">Use character</span> in the detail panel on the right.
        </p>
        <Link to="/" className="mt-4 inline-flex text-sm font-medium text-emerald-700 underline dark:text-emerald-400">
          Go to Characters
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PlayHeader c={c} onRest={() => setRestOpen(true)} classByIndex={classByIndex} isCaster={isCaster} />

      {restOpen ? (
        <RestDialog
          c={c}
          maxima={maxima}
          onClose={() => setRestOpen(false)}
          onPatch={(next) => patch(c.id, () => next)}
        />
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        {(
          [
            ["general", "General"],
            ["combat", "Combat"],
            ["spells", "Spells"]
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={
              "rounded-md px-3 py-1.5 text-sm font-medium transition " +
              (effectiveTab === id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : id === "spells" && !isCaster
                  ? "cursor-not-allowed text-zinc-400 dark:text-zinc-600"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800")
            }
            onClick={() => {
              if (id === "spells" && !isCaster) return;
              setTab(id);
            }}
            aria-disabled={id === "spells" && !isCaster}
          >
            {label}
          </button>
        ))}
      </div>

      {effectiveTab === "general" ? (
        <GeneralTab c={c} raceByIndex={catalog.loading ? dndRaceByIndex : catalog.racesByIndex} featByIndex={catalog.loading ? dndFeatByIndex : catalog.featsByIndex} />
      ) : null}
      {effectiveTab === "combat" ? (
        <CombatTab
          c={c}
          weapons={weapons}
          featByIndex={catalog.loading ? dndFeatByIndex : catalog.featsByIndex}
          onPatch={(next) => patch(c.id, () => next)}
        />
      ) : null}
      {effectiveTab === "spells" ? (
        <SpellsTab
          c={c}
          maxima={maxima}
          slotRows={slotRows}
          prepared={preparedLeveled}
          cantrips={cantrips}
          onPatch={(next) => patch(c.id, () => next)}
        />
      ) : null}
    </div>
  );
}

function RestDialog(props: {
  c: Character;
  maxima: ReturnType<typeof spellSlotMaximaForClass>;
  onClose(): void;
  onPatch(next: Character): void;
}) {
  const [kind, setKind] = useState<"short" | "long">("short");
  const [healHp, setHealHp] = useState("");

  function applyShort() {
    const n = healHp.trim() === "" ? 0 : Math.max(0, Math.floor(Number(healHp)));
    let next: Character = { ...props.c };
    if (n > 0) {
      next = {
        ...next,
        currentHp: Math.min(next.maxHp, next.currentHp + n)
      };
    }
    if (props.maxima.kind === "pact") {
      const key = String(props.maxima.slotSpellLevel);
      const u = { ...next.spellSlotsUsed };
      delete u[key];
      next = { ...next, spellSlotsUsed: u };
    }
    props.onPatch(next);
    props.onClose();
  }

  function applyLong() {
    props.onPatch({
      ...props.c,
      currentHp: props.c.maxHp,
      tempHp: 0,
      spellSlotsUsed: emptySpellSlotsUsed()
    });
    props.onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-50">Rest</h2>
          <button type="button" className={buttonClass("ghost")} onClick={props.onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className={buttonClass(kind === "short" ? "primary" : "ghost")}
            onClick={() => setKind("short")}
          >
            Short rest
          </button>
          <button
            type="button"
            className={buttonClass(kind === "long" ? "primary" : "ghost")}
            onClick={() => setKind("long")}
          >
            Long rest
          </button>
        </div>
        {kind === "short" ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Optional HP recovered. Warlock pact slots refresh on a short rest.
            </p>
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>HP recovered (optional)</span>
              <input className={inputClass()} type="number" min={0} value={healHp} onChange={(e) => setHealHp(e.target.value)} />
            </label>
            <button type="button" className={buttonClass("primary")} onClick={applyShort}>
              Apply short rest
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Restores full HP, clears temporary HP, and recovers all spell slots.
            </p>
            <button type="button" className={buttonClass("primary")} onClick={applyLong}>
              Apply long rest
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
