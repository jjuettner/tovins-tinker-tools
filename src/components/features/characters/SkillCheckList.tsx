import { useMemo, useState } from "react";
import {
  abilities,
  abilityMod,
  formatSigned,
  proficiencyBonus,
  skillAbility,
  skills,
  type Ability,
  type Skill
} from "@/lib/dnd";
import { ProficiencyEmptyMark } from "@/components/ui/ProficiencyEmptyMark";
import { ProficiencyMark } from "@/components/ui/ProficiencyMark";
import type { Character, CharacterDraft } from "@/types/character";

export type SkillCheckCharacter = Pick<Character, "level" | "stats" | "proficientSkills" | "proficientSaves">;

const initialAbilityOpen = (): Record<Ability, boolean> =>
  Object.fromEntries(abilities.map((a) => [a, false])) as Record<Ability, boolean>;

export function SkillCheckList(props: {
  c: Character | CharacterDraft;
  /** Default: no parentheses around ability scores. */
  scoreStyle?: "plain" | "paren";
  /** When true, show hollow circle for non-proficient saves and skills. */
  showNonProficiencyCircle?: boolean;
  /** Collapsible section with a header button (e.g. character edit preview). */
  collapsible?: boolean;
  /** Label for the collapsible toggle. */
  collapsibleTitle?: string;
  /** Each ability block (STR, DEX, …) can expand/collapse. */
  collapseByAbility?: boolean;
}) {
  const scoreStyle = props.scoreStyle ?? "plain";
  const showEmpty = props.showNonProficiencyCircle ?? true;
  const prof = proficiencyBonus(props.c.level);
  const [open, setOpen] = useState(true);
  const [abOpen, setAbOpen] = useState<Record<Ability, boolean>>(initialAbilityOpen);

  const byAbility = useMemo(() => {
    const map: Record<Ability, Skill[]> = { STR: [], DEX: [], CON: [], INT: [], WIS: [], CHA: [] };
    for (const s of skills) map[skillAbility[s]].push(s);
    return map;
  }, []);

  function renderAbilityBlock(ab: Ability) {
    const score = props.c.stats[ab];
    const base = abilityMod(score);
    const save = base + (props.c.proficientSaves.includes(ab) ? prof : 0);
    const saveProf = props.c.proficientSaves.includes(ab);

    const headerRow = (
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">{ab}</span>
          {scoreStyle === "paren" ? (
            <span className="text-sm text-zinc-600 dark:text-zinc-300">({score})</span>
          ) : (
            <span className="text-sm tabular-nums text-zinc-600 dark:text-zinc-300">{score}</span>
          )}
        </div>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{formatSigned(base)}</span>
      </div>
    );

    const skillList = (
      <ul className="mt-3 space-y-1 text-sm">
        <li className="flex items-center justify-between gap-3 text-zinc-700 dark:text-zinc-200">
          <span className="inline-flex items-center gap-2">
            {saveProf ? (
              <ProficiencyMark className="inline shrink-0 text-zinc-700 dark:text-zinc-200" />
            ) : showEmpty ? (
              <ProficiencyEmptyMark className="inline shrink-0 text-zinc-400 dark:text-zinc-500" />
            ) : null}
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
                {isP ? (
                  <ProficiencyMark className="inline shrink-0 text-zinc-600 dark:text-zinc-300" />
                ) : showEmpty ? (
                  <ProficiencyEmptyMark className="inline shrink-0 text-zinc-400 dark:text-zinc-500" />
                ) : null}
                {skill}
              </span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatSigned(val)}</span>
            </li>
          );
        })}
      </ul>
    );

    if (props.collapseByAbility) {
      const isOpen = abOpen[ab];
      return (
        <div
          key={ab}
          className="rounded-xl border border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-950/30"
        >
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-2 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50"
            onClick={() => setAbOpen((m) => ({ ...m, [ab]: !m[ab] }))}
            aria-expanded={isOpen}
          >
            <span>
              {ab}{" "}
              <span className="font-normal text-zinc-500 dark:text-zinc-400">
                {scoreStyle === "paren" ? `(${score})` : score} · mod {formatSigned(base)}
              </span>
            </span>
            <span className="text-xs font-normal text-zinc-500">{isOpen ? "Hide" : "Show"}</span>
          </button>
          {isOpen ? (
            <div className="border-t border-zinc-200 px-4 pb-4 pt-2 dark:border-zinc-800">{skillList}</div>
          ) : null}
        </div>
      );
    }

    return (
      <div
        key={ab}
        className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30"
      >
        {headerRow}
        {skillList}
      </div>
    );
  }

  const grid = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{abilities.map((ab) => renderAbilityBlock(ab))}</div>
  );

  if (props.collapsible) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/20">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md border border-zinc-200 bg-white/60 px-4 py-2 text-left text-sm font-semibold text-zinc-900 transition hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-50 dark:hover:bg-zinc-900"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span>{props.collapsibleTitle ?? "Skills & saves"}</span>
          <span className="text-xs font-normal text-zinc-500">{open ? "Hide" : "Show"}</span>
        </button>
        {open ? <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">{grid}</div> : null}
      </div>
    );
  }

  return grid;
}
