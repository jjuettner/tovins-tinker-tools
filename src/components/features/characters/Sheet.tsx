import { Pencil } from "lucide-react";
import { useMemo } from "react";
import {
  abilities,
  abilityMod,
  formatSigned,
  proficiencyBonus,
  skillAbility,
  skills,
  type Ability,
  type Skill
} from "../../../lib/dnd";
import { dndClassByIndex, dndFeatByIndex, dndSpellByIndex } from "../../../lib/dndData";
import { buttonClass } from "../../ui/controlClasses";
import type { Character } from "../../../types/character";

export function CharacterSheet(props: { c: Character; onEdit(): void }) {
  const prof = proficiencyBonus(props.c.level);
  const className = dndClassByIndex[props.c.classIndex]?.name ?? (props.c.classIndex ? props.c.classIndex : "Class");
  const spellNames = useMemo(
    () =>
      (props.c.spells ?? []).map((idx) => {
        const s = dndSpellByIndex[idx];
        if (!s) return idx;
        return `${s.name} (${s.level === 0 ? "cantrip" : `lv${s.level}`})`;
      }),
    [props.c.spells]
  );
  const featNames = useMemo(
    () => (props.c.feats ?? []).map((idx) => dndFeatByIndex[idx]?.name ?? idx),
    [props.c.feats]
  );

  const byAbility = useMemo(() => {
    const map: Record<Ability, Skill[]> = { STR: [], DEX: [], CON: [], INT: [], WIS: [], CHA: [] };
    for (const s of skills) map[skillAbility[s]].push(s);
    return map;
  }, []);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {props.c.name || "Unnamed character"}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {props.c.world ? <span className="font-medium">{props.c.world}</span> : <span>World</span>}
            <span className="px-2 text-zinc-400">·</span>
            <span className="font-medium">{className}</span>
            <span className="px-2 text-zinc-400">·</span>
            <span>Level {props.c.level}</span>
            <span className="px-2 text-zinc-400">·</span>
            <span>Proficiency {formatSigned(prof)}</span>
          </p>
        </div>
        <button type="button" className={buttonClass("ghost")} onClick={props.onEdit}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {abilities.map((ab) => {
          const score = props.c.stats[ab];
          const base = abilityMod(score);
          const save = base + (props.c.proficientSaves.includes(ab) ? prof : 0);
          return (
            <div
              key={ab}
              className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">{ab}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">({score})</span>
                </div>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{formatSigned(base)}</span>
              </div>

              <ul className="mt-3 space-y-1 text-sm">
                <li className="flex items-center justify-between gap-3 text-zinc-700 dark:text-zinc-200">
                  <span className="inline-flex items-center gap-2">
                    {props.c.proficientSaves.includes(ab) ? <span className="text-xs font-semibold">(P)</span> : null}
                    Saving Throw
                  </span>
                  <span className="font-medium">{formatSigned(save)}</span>
                </li>
                {byAbility[ab].map((skill) => {
                  const val = base + (props.c.proficientSkills.includes(skill) ? prof : 0);
                  const isP = props.c.proficientSkills.includes(skill);
                  return (
                    <li key={skill} className="flex items-center justify-between gap-3 text-zinc-600 dark:text-zinc-300">
                      <span className="inline-flex items-center gap-2">
                        {isP ? <span className="text-xs font-semibold">(P)</span> : null}
                        {skill}
                      </span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatSigned(val)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Spells</h3>
          {spellNames.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-200">
              {spellNames.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">None yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Feats</h3>
          {featNames.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-zinc-700 dark:text-zinc-200">
              {featNames.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">None yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

