import { Check, Save, X } from "lucide-react";
import { useMemo, useState } from "react";
import { abilities, abilityMod, formatSigned, proficiencyBonus, skillAbility, skills } from "../../../lib/dnd";
import type { Ability, Skill } from "../../../lib/dnd";
import { dndClasses, dndFeats, dndFeatByIndex, dndSpellByIndex, dndSpells } from "../../../lib/dndData";
import { toggleInList } from "../../../lib/utils";
import type { CharacterDraft } from "../../../types/character";
import { buttonClass, inputClass, smallLabelClass } from "../../ui/controlClasses";

export function CharacterEditor(props: {
  draft: CharacterDraft;
  onChange(next: CharacterDraft): void;
  onCancel(): void;
  onSave(): void;
  title: string;
}) {
  const prof = proficiencyBonus(props.draft.level);
  const canSave = props.draft.name.trim().length > 0 && props.draft.classIndex.trim().length > 0;
  const [spellQuery, setSpellQuery] = useState("");
  const [featQuery, setFeatQuery] = useState("");
  const filteredSpells = useMemo(() => {
    const q = spellQuery.trim().toLowerCase();
    if (!q) return dndSpells;
    return dndSpells.filter((s) => s.name.toLowerCase().includes(q));
  }, [spellQuery]);
  const filteredFeats = useMemo(() => {
    const q = featQuery.trim().toLowerCase();
    if (!q) return dndFeats;
    return dndFeats.filter((f) => f.name.toLowerCase().includes(q));
  }, [featQuery]);
  const selectedSpells = useMemo(
    () => props.draft.spells.map((idx) => dndSpellByIndex[idx]?.name ?? idx),
    [props.draft.spells]
  );
  const selectedFeats = useMemo(
    () => props.draft.feats.map((idx) => dndFeatByIndex[idx]?.name ?? idx),
    [props.draft.feats]
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {props.title}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Proficiency bonus from level: <span className="font-semibold">{formatSigned(prof)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={buttonClass("ghost")} onClick={props.onCancel}>
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </button>
          <button
            type="button"
            className={buttonClass("primary")}
            onClick={props.onSave}
            disabled={!canSave}
            title={!canSave ? "Need name + class" : undefined}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Name</span>
          <input
            value={props.draft.name}
            onChange={(e) => props.onChange({ ...props.draft, name: e.target.value })}
            className={inputClass()}
            placeholder="Eldrin"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Game / world</span>
          <input
            value={props.draft.world}
            onChange={(e) => props.onChange({ ...props.draft, world: e.target.value })}
            className={inputClass()}
            placeholder="Forgotten Realms"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Class</span>
          <select
            value={props.draft.classIndex}
            onChange={(e) => props.onChange({ ...props.draft, classIndex: e.target.value })}
            className={inputClass()}
          >
            <option value="" disabled>
              Choose…
            </option>
            {dndClasses.map((c) => (
              <option key={c.index} value={c.index}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className={smallLabelClass()}>Level</span>
          <input
            type="number"
            min={1}
            max={20}
            value={props.draft.level}
            onChange={(e) => props.onChange({ ...props.draft, level: Number(e.target.value) })}
            className={inputClass()}
          />
        </label>
      </div>

      {!canSave ? (
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">Need name + class to save.</p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {abilities.map((ab) => (
          <label key={ab} className="flex flex-col gap-1">
            <span className={smallLabelClass()}>
              {ab}{" "}
              <span className="font-normal text-zinc-500 dark:text-zinc-400">
                ({formatSigned(abilityMod(props.draft.stats[ab]))})
              </span>
            </span>
            <input
              type="number"
              min={1}
              max={30}
              value={props.draft.stats[ab]}
              onChange={(e) =>
                props.onChange({
                  ...props.draft,
                  stats: { ...props.draft.stats, [ab]: Number(e.target.value) }
                })
              }
              className={inputClass()}
            />
          </label>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Saving throw proficiency</h3>
            <span className="text-xs text-zinc-600 dark:text-zinc-300">toggle</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {abilities.map((ab) => {
              const active = props.draft.proficientSaves.includes(ab);
              return (
                <button
                  key={ab}
                  type="button"
                  className={
                    "inline-flex items-center justify-between rounded-md border px-3 py-2 text-sm transition " +
                    (active
                      ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      : "border-zinc-200 bg-white/50 text-zinc-700 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-300 dark:hover:bg-zinc-950/40")
                  }
                  onClick={() =>
                    props.onChange({
                      ...props.draft,
                      proficientSaves: toggleInList(props.draft.proficientSaves, ab as Ability)
                    })
                  }
                >
                  <span className="font-medium">{ab}</span>
                  {active ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ability check proficiency</h3>
            <span className="text-xs text-zinc-600 dark:text-zinc-300">toggle</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {skills.map((sk) => {
              const active = props.draft.proficientSkills.includes(sk);
              return (
                <button
                  key={sk}
                  type="button"
                  className={
                    "inline-flex items-center justify-between rounded-md border px-3 py-2 text-sm transition " +
                    (active
                      ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                      : "border-zinc-200 bg-white/50 text-zinc-700 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-300 dark:hover:bg-zinc-950/40")
                  }
                  onClick={() =>
                    props.onChange({
                      ...props.draft,
                      proficientSkills: toggleInList(props.draft.proficientSkills, sk as Skill)
                    })
                  }
                >
                  <span className="truncate">{sk}</span>
                  <span className="ml-3 inline-flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{skillAbility[sk]}</span>
                    {active ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Spells</h3>
            <span className="text-xs text-zinc-600 dark:text-zinc-300">{props.draft.spells.length} selected</span>
          </div>

          <input
            className={inputClass() + " mt-3"}
            placeholder="Search spells…"
            value={spellQuery}
            onChange={(e) => setSpellQuery(e.target.value)}
          />

          {props.draft.spells.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedSpells.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center rounded-full border border-zinc-200 bg-white/70 px-2 py-0.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-zinc-200 bg-white/50 p-2 dark:border-zinc-800 dark:bg-zinc-950/20">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredSpells.map((s) => {
                const active = props.draft.spells.includes(s.index);
                return (
                  <button
                    key={s.index}
                    type="button"
                    className={
                      "inline-flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition " +
                      (active
                        ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                        : "border-zinc-200 bg-white/50 text-zinc-700 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-300 dark:hover:bg-zinc-950/40")
                    }
                    onClick={() =>
                      props.onChange({
                        ...props.draft,
                        spells: toggleInList(props.draft.spells, s.index)
                      })
                    }
                  >
                    <span className="truncate">
                      {s.name}{" "}
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {s.level === 0 ? "cantrip" : `lv${s.level}`}
                      </span>
                    </span>
                    {active ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Feats</h3>
            <span className="text-xs text-zinc-600 dark:text-zinc-300">{props.draft.feats.length} selected</span>
          </div>

          <input
            className={inputClass() + " mt-3"}
            placeholder="Search feats…"
            value={featQuery}
            onChange={(e) => setFeatQuery(e.target.value)}
          />

          {props.draft.feats.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedFeats.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center rounded-full border border-zinc-200 bg-white/70 px-2 py-0.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200"
                >
                  {name}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-zinc-200 bg-white/50 p-2 dark:border-zinc-800 dark:bg-zinc-950/20">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredFeats.map((f) => {
                const active = props.draft.feats.includes(f.index);
                return (
                  <button
                    key={f.index}
                    type="button"
                    className={
                      "inline-flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition " +
                      (active
                        ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                        : "border-zinc-200 bg-white/50 text-zinc-700 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-300 dark:hover:bg-zinc-950/40")
                    }
                    onClick={() =>
                      props.onChange({
                        ...props.draft,
                        feats: toggleInList(props.draft.feats, f.index)
                      })
                    }
                    title={f.description}
                  >
                    <span className="truncate">{f.name}</span>
                    {active ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

