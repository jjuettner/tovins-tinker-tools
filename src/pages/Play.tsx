import { X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buttonClass, highlightButtonClass } from "@/components/ui/controlClasses";
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

export function PlayPage() {
  const { characters: characterItems, save } = useCharacters();
  const { value: usedCharacterId } = useStoredState<string | null>(STORAGE_KEYS.usedCharacterId, null);
  const [tab, setTab] = useState<Tab>("general");
  const [restOpen, setRestOpen] = useState(false);

  const characters = useMemo(() => characterItems.map((x) => x.character), [characterItems]);

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
  const cls =
    (c?.classIndex ? classByIndex[c.classIndex] : undefined) ??
    (c?.classIndex ? dndClassByIndex[c.classIndex] : undefined);

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
    return hasSlots || knowsSpells;
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
              id === "spells" && !isCaster
                ? "rounded-md px-3 py-1.5 text-sm font-medium transition cursor-not-allowed text-zinc-400 dark:text-zinc-600"
                : highlightButtonClass(effectiveTab === id)
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
        <GeneralTab
          c={c}
          raceByIndex={catalog.loading ? dndRaceByIndex : catalog.racesByIndex}
          featByIndex={catalog.loading ? dndFeatByIndex : catalog.featsByIndex}
        />
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
  maxima: ReturnType<typeof spellSlotMaximaForClass> | { kind: "none" };
  onClose(): void;
  onPatch(next: Character): void;
}) {
  const [shortRestHeal, setShortRestHeal] = useState<string>("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Rest</div>
          <button type="button" className={buttonClass("ghost")} onClick={props.onClose} aria-label="Close">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Pick short or long rest.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Short rest</div>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Heal HP. Temp HP unchanged.</p>
            <div className="mt-3 flex items-end gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  HP healed
                </span>
                <input
                  type="number"
                  min={0}
                  className="h-9 w-28 rounded-md border border-zinc-200 bg-white/70 px-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-50"
                  value={shortRestHeal}
                  onChange={(e) => setShortRestHeal(e.target.value)}
                />
              </label>
              <button
                type="button"
                className={buttonClass("ghost") + " justify-center"}
                onClick={() => {
                  const n = Math.max(0, Math.floor(Number(shortRestHeal) || 0));
                  const next: Character = {
                    ...props.c,
                    currentHp: Math.min(props.c.maxHp, props.c.currentHp + n)
                  };
                  props.onPatch(next);
                  props.onClose();
                }}
              >
                Apply
              </button>
            </div>
          </div>
          <button
            type="button"
            className={buttonClass("primary") + " justify-center"}
            onClick={() => {
              const next: Character = {
                ...props.c,
                tempHp: 0,
                currentHp: props.c.maxHp,
                spellSlotsUsed: emptySpellSlotsUsed()
              };
              props.onPatch(next);
              props.onClose();
            }}
          >
            Long rest
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <div>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Short rest</span>: heal HP (temp HP unchanged).
          </div>
          <div>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Long rest</span>: full HP + clear temp HP + reset spell slots.
          </div>
        </div>
      </div>
    </div>
  );
}
