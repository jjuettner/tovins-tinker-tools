import { Bomb, Crosshair, Droplet, Heart, Sword, Tent, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStoredState } from "../../../hooks/useStoredState";
import { formatSigned } from "../../../lib/dnd";
import { normalizeCharacter } from "../../../lib/characterNormalize";
import {
  resolvedWeaponMasteryIndex,
  unarmedDamageBonus,
  unarmedToHit,
  weaponDamageSummary,
  weaponToHitBonus
} from "../../../lib/combat";
import { dndClassByIndex, dndFeatByIndex, dndSpellByIndex, type DndSpell } from "../../../lib/dndData";
import { dndEquipmentByIndex, isWeapon } from "../../../lib/dndEquipment";
import { dndRaceByIndex } from "../../../lib/dndRaces";
import { dndTraitByIndex } from "../../../lib/dndTraits";
import { dndWeaponMasteryByIndex } from "../../../lib/dndWeaponMastery";
import { computeSpellSlotsRemaining, emptySpellSlotsUsed, spellSlotMaximaForClass } from "../../../lib/spellSlots";
import { STORAGE_KEYS } from "../../../lib/appConstants";
import { splitEquipped } from "../../../lib/equippedLayout";
import { buttonClass, inputClass, smallLabelClass } from "../../ui/controlClasses";
import { SkillCheckList } from "../characters/SkillCheckList";
import type { Character } from "../../../types/character";

const DAMAGE_TYPES = [
  "bludgeoning",
  "piercing",
  "slashing",
  "acid",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "poison",
  "psychic",
  "radiant",
  "thunder"
] as const;

type Tab = "general" | "combat" | "spells";

type DamageRow = { type: string; amount: number };

export function PlayFeature() {
  const { value: characters, setValue: setCharacters } = useStoredState<Character[]>(STORAGE_KEYS.characters, []);
  const { value: usedCharacterId } = useStoredState<string | null>(STORAGE_KEYS.usedCharacterId, null);
  const [tab, setTab] = useState<Tab>("general");
  const [restOpen, setRestOpen] = useState(false);

  const c = useMemo(
    () => (usedCharacterId ? characters.find((ch) => ch.id === usedCharacterId) : undefined),
    [characters, usedCharacterId]
  );

  const patch = useCallback(
    (id: string, fn: (x: Character) => Character) => {
      setCharacters((prev) => prev.map((ch) => (ch.id === id ? normalizeCharacter(fn(ch)) : ch)));
    },
    [setCharacters]
  );

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

  const cls = dndClassByIndex[c.classIndex];
  const maxima = useMemo(() => spellSlotMaximaForClass(cls, c.level), [cls, c.level]);
  const slotRows = useMemo(
    () => computeSpellSlotsRemaining(maxima, c.spellSlotsUsed),
    [maxima, c.spellSlotsUsed]
  );

  const preparedLeveled = useMemo(
    () =>
      (c.spells ?? [])
        .map((idx) => dndSpellByIndex[idx])
        .filter((s): s is DndSpell => Boolean(s && s.level > 0))
        .sort((a, b) => (a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name))),
    [c.spells]
  );

  const cantrips = useMemo(
    () =>
      (c.spells ?? [])
        .map((idx) => dndSpellByIndex[idx])
        .filter((s): s is DndSpell => Boolean(s && s.level === 0))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [c.spells]
  );

  const weapons = useMemo(
    () =>
      splitEquipped(c.equipped).weapons.filter((w) => {
        const eq = dndEquipmentByIndex[w.equipmentIndex];
        return Boolean(w.equipmentIndex && eq && isWeapon(eq));
      }),
    [c.equipped]
  );

  return (
    <div className="flex flex-col gap-4">
      <PlayHeader c={c} onRest={() => setRestOpen(true)} />

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
              (tab === id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800")
            }
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "general" ? <GeneralTab c={c} /> : null}
      {tab === "combat" ? <CombatTab c={c} weapons={weapons} onPatch={(next) => patch(c.id, () => next)} /> : null}
      {tab === "spells" ? (
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

function GeneralTab(props: { c: Character }) {
  const raceTraits = useMemo(() => {
    const race = dndRaceByIndex[props.c.raceIndex];
    if (!race?.traits?.length) return [];
    return race.traits
      .map((t) => {
        const full = dndTraitByIndex[t.index];
        return { index: t.index, name: full?.name ?? t.name, description: full?.description };
      })
      .filter((t) => t.name);
  }, [props.c.raceIndex]);

  const featBlocks = useMemo(
    () =>
      (props.c.feats ?? [])
        .map((i) => dndFeatByIndex[i])
        .filter((f): f is NonNullable<typeof f> => Boolean(f))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [props.c.feats]
  );

  return (
    <div className="space-y-8">
      <SkillCheckList c={props.c} />

      {raceTraits.length > 0 ? (
        <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Traits</h2>
          <ul className="mt-3 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
            {raceTraits.map((t) => (
              <li key={t.index}>
                <div className="font-medium text-zinc-900 dark:text-zinc-50">{t.name}</div>
                {t.description ? (
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {t.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Feats</h2>
        {featBlocks.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">None.</p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
            {featBlocks.map((f) => (
              <li key={f.index}>
                <div className="font-medium text-zinc-900 dark:text-zinc-50">{f.name}</div>
                {f.description ? (
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {f.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function hpHeartClass(c: Character): string {
  const max = Math.max(1, c.maxHp);
  const cur = Math.min(max, Math.max(0, c.currentHp));
  const ratio = cur / max;
  if (ratio > 0.5) return "text-emerald-600 dark:text-emerald-400";
  if (ratio > 0.25) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function PlayHeader(props: { c: Character; onRest(): void }) {
  const clsName = dndClassByIndex[props.c.classIndex]?.name ?? (props.c.classIndex || "Class");
  const hpCls = hpHeartClass(props.c);

  return (
    <header className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50/90 p-5 shadow-sm dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-950/60">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {props.c.name || "Unnamed"}
          </h1>
          <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            {clsName} · Level {props.c.level}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className={`flex items-center gap-2 text-sm font-semibold tracking-tight ${hpCls}`}>
              <Heart className="h-5 w-5 shrink-0 fill-current" aria-hidden="true" />
              <span>
                <span className="mr-1 text-xs font-medium opacity-90">HP</span>
                <span className="tabular-nums">
                  {props.c.currentHp}/{props.c.maxHp}
                </span>
                {props.c.tempHp > 0 ? <span className="font-medium"> (+{props.c.tempHp})</span> : null}
              </span>
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-300">
              AC <span className="font-semibold text-zinc-900 dark:text-zinc-50">{props.c.armorClass}</span>
            </div>
          </div>
        </div>
        <button type="button" className={buttonClass("ghost")} onClick={props.onRest} title="Short or long rest">
          <Tent className="h-4 w-4" aria-hidden="true" />
          Rest
        </button>
      </div>
    </header>
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

function SpellPlayCard({ spell }: { spell: DndSpell }) {
  const desc = (spell.desc ?? []).join("\n\n");
  const hi = (spell.higher_level ?? []).join("\n\n");
  return (
    <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50/90 p-3 text-left text-xs dark:border-zinc-700 dark:bg-zinc-950/50">
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        {spell.school?.name ? <span>{spell.school.name}</span> : null}
        {spell.casting_time ? <span>· {spell.casting_time}</span> : null}
        {spell.range ? <span>· {spell.range}</span> : null}
        {spell.duration ? <span>· {spell.duration}</span> : null}
        {spell.concentration ? <span>· Concentration</span> : null}
        {spell.ritual ? <span>· Ritual</span> : null}
      </div>
      {desc ? <p className="mt-2 whitespace-pre-wrap leading-relaxed text-zinc-700 dark:text-zinc-200">{desc}</p> : null}
      {hi ? (
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">At higher levels. </span>
          {hi}
        </p>
      ) : null}
    </div>
  );
}

function SpellsTab(props: {
  c: Character;
  maxima: ReturnType<typeof spellSlotMaximaForClass>;
  slotRows: ReturnType<typeof computeSpellSlotsRemaining>;
  prepared: DndSpell[];
  cantrips: DndSpell[];
  onPatch(next: Character): void;
}) {
  const [castSpell, setCastSpell] = useState<{ index: string; name: string; level: number } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {props.cantrips.length > 0 ? (
        <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Cantrips</h2>
          <ul className="mt-3 space-y-2">
            {props.cantrips.map((s) => (
              <li key={s.index} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex gap-2 p-2">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="w-full rounded-md px-2 py-1.5 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800/60"
                      onClick={() => setExpandedId((id) => (id === s.index ? null : s.index))}
                    >
                      {s.name}
                      <span className="ml-2 text-xs font-normal text-zinc-500">Cantrip</span>
                    </button>
                    {expandedId === s.index ? <SpellPlayCard spell={s} /> : null}
                  </div>
                  <div className="flex w-[5.5rem] shrink-0 items-start justify-end pt-1">
                    <span className="text-[11px] text-zinc-400">—</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Spell slots</h2>
        {props.slotRows.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">No spell slots for this class / level.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {props.slotRows.map((r) => (
              <li
                key={r.spellLevel}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
              >
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Level {r.spellLevel}</div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {r.remaining}/{r.max}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Prepared spells</h2>
        {props.prepared.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">No leveled prepared spells.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {props.prepared.map((s) => {
              const rows = props.slotRows.filter((r) => r.spellLevel >= s.level && r.remaining > 0);
              const disabled = rows.length === 0;
              return (
                <li key={s.index} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="flex gap-2 p-2">
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        className="w-full rounded-md px-2 py-1.5 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800/60"
                        onClick={() => setExpandedId((id) => (id === s.index ? null : s.index))}
                      >
                        {s.name}
                        <span className="ml-2 text-xs font-normal text-zinc-500">Lv {s.level}+</span>
                      </button>
                      {expandedId === s.index ? <SpellPlayCard spell={s} /> : null}
                    </div>
                    <div className="flex w-[5.5rem] shrink-0 items-start justify-end">
                      <button
                        type="button"
                        disabled={disabled}
                        className={
                          buttonClass("primary") +
                          " min-h-[2.25rem] px-3 py-1.5 text-xs " +
                          (disabled ? "opacity-50" : "")
                        }
                        onClick={() => setCastSpell({ index: s.index, name: s.name, level: s.level })}
                      >
                        Cast
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {castSpell ? (
        <CastSpellModal
          key={castSpell.index}
          c={props.c}
          spell={castSpell}
          maxima={props.maxima}
          onClose={() => setCastSpell(null)}
          onConfirm={(slotLevel) => {
            const key = String(slotLevel);
            const used = { ...props.c.spellSlotsUsed };
            used[key] = (used[key] ?? 0) + 1;
            props.onPatch({ ...props.c, spellSlotsUsed: used });
            setCastSpell(null);
          }}
        />
      ) : null}
    </div>
  );
}

function CastSpellModal(props: {
  c: Character;
  spell: { index: string; name: string; level: number };
  maxima: ReturnType<typeof spellSlotMaximaForClass>;
  onClose(): void;
  onConfirm(slotLevel: number): void;
}) {
  const rows = computeSpellSlotsRemaining(props.maxima, props.c.spellSlotsUsed);
  const options = rows.filter((r) => r.spellLevel >= props.spell.level && r.remaining > 0);
  const [pick, setPick] = useState(options[0]?.spellLevel ?? props.spell.level);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">Cast {props.spell.name}</h2>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Spell level {props.spell.level}. Pick slot level to expend (upcasting).</p>
        {options.length === 0 ? (
          <p className="mt-3 text-sm text-red-600">No valid slots.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {options.map((o) => (
              <label key={o.spellLevel} className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                <input type="radio" name="slot" checked={pick === o.spellLevel} onChange={() => setPick(o.spellLevel)} />
                Level {o.spellLevel} ({o.remaining} left)
              </label>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={buttonClass("ghost")} onClick={props.onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={buttonClass("primary")}
            disabled={options.length === 0}
            onClick={() => props.onConfirm(pick)}
          >
            Use slot
          </button>
        </div>
      </div>
    </div>
  );
}

function CombatTab(props: {
  c: Character;
  weapons: import("../../../types/character").EquippedItem[];
  onPatch(next: Character): void;
}) {
  const [rows, setRows] = useState<DamageRow[]>([{ type: "bludgeoning", amount: 0 }]);
  const [attackCtx, setAttackCtx] = useState<
    | { kind: "weapon"; weapon: import("../../../types/character").EquippedItem }
    | { kind: "unarmed" }
    | null
  >(null);

  function addRow() {
    setRows((r) => [...r, { type: "bludgeoning", amount: 0 }]);
  }

  function applyDamage() {
    let total = 0;
    for (const row of rows) total += Math.max(0, Math.floor(row.amount));
    if (total <= 0) return;
    let temp = props.c.tempHp;
    let cur = props.c.currentHp;
    let fromTemp = Math.min(temp, total);
    temp -= fromTemp;
    const rest = total - fromTemp;
    cur = Math.max(0, cur - rest);
    props.onPatch({ ...props.c, tempHp: temp, currentHp: cur });
    setRows([{ type: "bludgeoning", amount: 0 }]);
  }

  const uh = unarmedToHit(props.c);
  const ud = unarmedDamageBonus(props.c);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <Droplet className="h-4 w-4 text-red-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Take damage</h2>
        </div>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Temp HP is reduced first.</p>
        <div className="mt-3 space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1">
                <span className={smallLabelClass()}>Type</span>
                <select
                  className={inputClass()}
                  value={row.type}
                  onChange={(e) =>
                    setRows((r) => r.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))
                  }
                >
                  {DAMAGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className={smallLabelClass()}>Amount</span>
                <input
                  type="number"
                  min={0}
                  className={inputClass() + " w-24"}
                  value={row.amount || ""}
                  onChange={(e) =>
                    setRows((r) => r.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)))
                  }
                />
              </label>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={buttonClass("ghost")} onClick={addRow} aria-label="Add damage type">
            + row
          </button>
          <button type="button" className={buttonClass("primary")} onClick={applyDamage}>
            Apply damage
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Attacks</h2>
        <ul className="mt-3 space-y-2">
          <li className="grid grid-cols-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-3 dark:border-zinc-800 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-3">
            <span className="min-w-0 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">Unarmed strike</span>
            <div className="flex items-center gap-1.5 text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
              <Crosshair className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
              {formatSigned(uh)}
            </div>
            <div className="flex min-w-0 items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
              <Bomb className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
              <span className="truncate">
                1 {formatSigned(ud)} bludgeoning
              </span>
            </div>
            <div className="flex justify-start sm:justify-end">
              <button type="button" className={buttonClass("ghost")} onClick={() => setAttackCtx({ kind: "unarmed" })} aria-label="Attack">
                <Sword className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </li>
          {props.weapons.map((w) => {
            const eq = dndEquipmentByIndex[w.equipmentIndex];
            const th = weaponToHitBonus(props.c, w);
            const dmg = weaponDamageSummary(props.c, w);
            return (
              <li
                key={w.id}
                className="grid grid-cols-1 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-3 dark:border-zinc-800 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-3"
              >
                <span className="min-w-0 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {eq?.name ?? w.equipmentIndex}
                </span>
                <div className="flex items-center gap-1.5 text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
                  <Crosshair className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
                  {formatSigned(th)}
                </div>
                <div className="flex min-w-0 items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                  <Bomb className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
                  <span className="truncate">
                    {dmg.dice}
                    {dmg.bonus !== 0 ? ` ${formatSigned(dmg.bonus)}` : ""} {dmg.type}
                  </span>
                </div>
                <div className="flex justify-start sm:justify-end">
                  <button
                    type="button"
                    className={buttonClass("ghost")}
                    onClick={() => setAttackCtx({ kind: "weapon", weapon: w })}
                    aria-label="Attack"
                  >
                    <Sword className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {attackCtx ? (
        <AttackRollModal
          c={props.c}
          ctx={attackCtx}
          onClose={() => setAttackCtx(null)}
        />
      ) : null}
    </div>
  );
}

function AttackRollModal(props: {
  c: Character;
  ctx: { kind: "weapon"; weapon: import("../../../types/character").EquippedItem } | { kind: "unarmed" };
  onClose(): void;
}) {
  const toHit =
    props.ctx.kind === "unarmed" ? unarmedToHit(props.c) : weaponToHitBonus(props.c, props.ctx.weapon);
  const [step, setStep] = useState<"roll" | "hit">("roll");

  const combatFeatHints = useMemo(() => {
    return (props.c.feats ?? [])
      .map((i) => dndFeatByIndex[i])
      .filter((f): f is NonNullable<typeof f> => Boolean(f))
      .filter((f) => {
        const t = `${f.name} ${f.description ?? ""}`.toLowerCase();
        return t.includes("weapon") || t.includes("attack") || t.includes("damage") || t.includes("critical");
      });
  }, [props.c.feats]);

  const dmg =
    props.ctx.kind === "unarmed"
      ? { dice: "1", bonus: unarmedDamageBonus(props.c), type: "bludgeoning" }
      : weaponDamageSummary(props.c, props.ctx.weapon);

  const masteryInfo = useMemo(() => {
    if (props.ctx.kind !== "weapon") return null;
    const eq = dndEquipmentByIndex[props.ctx.weapon.equipmentIndex];
    const mid = resolvedWeaponMasteryIndex(props.ctx.weapon, eq);
    if (!mid) return null;
    return dndWeaponMasteryByIndex[mid];
  }, [props.ctx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        {step === "roll" ? (
          <>
            <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">Attack roll</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <Crosshair className="h-4 w-4 shrink-0 opacity-90" aria-hidden="true" />
              <span>
                d20 <span className="font-semibold tabular-nums">{formatSigned(toHit)}</span>
              </span>
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className={buttonClass("primary") + " inline-flex items-center gap-2"}
                onClick={() => setStep("hit")}
              >
                <Crosshair className="h-4 w-4" aria-hidden="true" />
                Hit
              </button>
              <button type="button" className={buttonClass("ghost")} onClick={props.onClose}>
                Miss
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">Damage</h2>
            <p className="mt-2 flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <Bomb className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden="true" />
              <span>
                {dmg.dice}
                {dmg.bonus !== 0 ? ` ${formatSigned(dmg.bonus)}` : ""} {dmg.type}
              </span>
            </p>
            {masteryInfo ? (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950/40">
                <div className="font-semibold text-zinc-900 dark:text-zinc-50">Mastery: {masteryInfo.name}</div>
                {masteryInfo.description ? (
                  <p className="mt-1 whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">{masteryInfo.description}</p>
                ) : null}
              </div>
            ) : null}
            {combatFeatHints.length > 0 ? (
              <ul className="mt-3 max-h-40 overflow-auto text-xs text-zinc-600 dark:text-zinc-300">
                {combatFeatHints.map((f) => (
                  <li key={f.index} className="mt-1 border-t border-zinc-100 pt-1 dark:border-zinc-800">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{f.name}:</span> {f.description}
                  </li>
                ))}
              </ul>
            ) : null}
            <button type="button" className={buttonClass("primary") + " mt-4"} onClick={props.onClose}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
