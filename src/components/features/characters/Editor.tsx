import { Check, Save, X } from "lucide-react";
import { abilities, abilityMod, formatSigned, proficiencyBonus, skillAbility, skills } from "../../../lib/dnd";
import type { Ability, Skill } from "../../../lib/dnd";
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
          <button type="button" className={buttonClass("primary")} onClick={props.onSave}>
            <Save className="h-4 w-4" aria-hidden="true" />
            Save
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
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
    </section>
  );
}

