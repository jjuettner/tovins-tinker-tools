import { CirclePlus, Tent } from "lucide-react";
import { buttonClass } from "@/components/ui/controlClasses";
import CharacterAvatar from "@/components/ui/CharacterAvatar";
import HpReadonlyBadge from "@/components/ui/HpReadonlyBadge";
import ConditionPills from "@/components/ui/ConditionPills";
import { formatSigned } from "@/lib/dnd";
import { spellAttackAndSaveDcForCharacter } from "@/lib/spellcasting";
import type { Character } from "@/types/character";
import type { DndClass } from "@/lib/dndData";

export default function PlayHeader(props: {
  c: Character;
  onRest(): void;
  onOpenConditions(): void;
  classByIndex: Record<string, DndClass>;
  isCaster: boolean;
  conditionLabelBySlug: Map<string, string>;
  onConditionPillClick(slug: string): void;
}) {
  const clsName = props.classByIndex[props.c.classIndex]?.name ?? (props.c.classIndex || "Class");
  const spell = props.isCaster ? spellAttackAndSaveDcForCharacter(props.c) : null;
  const slugs = props.c.conditionSlugs ?? [];

  return (
    <header className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50/90 p-5 shadow-sm dark:border-zinc-800 dark:from-zinc-900/80 dark:to-zinc-950/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="hidden shrink-0 md:block">
            <CharacterAvatar
              characterId={props.c.id}
              name={props.c.name || "Unnamed"}
              classIndex={props.c.classIndex}
              avatarUrl={props.c.avatarUrl}
              size="lg"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {props.c.name || "Unnamed"}
            </h1>
            <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              <span className="text-zinc-800 dark:text-zinc-100">{clsName}</span>
              <span className="text-zinc-400 dark:text-zinc-500"> · </span>
              {props.c.subclassIndex?.trim() ? (
                <span className="text-zinc-800 dark:text-zinc-100">{props.c.subclassIndex.trim()}</span>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500" title="Subclass (optional)">
                  —
                </span>
              )}
              <span className="text-zinc-400 dark:text-zinc-500"> · </span>
              Level {props.c.level}
            </p>

            <div
              className={
                "mt-4 grid gap-3 " + (props.isCaster ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-2")
              }
            >
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Hit points
                </div>
                <div className="mt-1">
                  <HpReadonlyBadge currentHp={props.c.currentHp} maxHp={props.c.maxHp} tempHp={props.c.tempHp} />
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Armor class
                </div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {props.c.armorClass}
                </div>
              </div>
              {props.isCaster && spell ? (
                <>
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Spell attack
                    </div>
                    <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatSigned(spell.spellAttackMod)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Spell save DC
                    </div>
                    <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {spell.spellSaveDc}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 self-stretch sm:flex-row sm:items-start lg:flex-col lg:items-end">
          <button type="button" className={buttonClass("ghost")} onClick={props.onRest} title="Short or long rest">
            <Tent className="h-4 w-4" aria-hidden="true" />
            Rest
          </button>
          <button type="button" className={buttonClass("ghost")} onClick={props.onOpenConditions} title="Add condition">
            <CirclePlus className="h-4 w-4" aria-hidden="true" />
            Conditions
          </button>
        </div>
      </div>

      {slugs.length > 0 ? (
        <div className="mt-4 border-t border-zinc-200/80 pt-3 dark:border-zinc-800/80">
          <ConditionPills slugs={slugs} labelBySlug={props.conditionLabelBySlug} onPillClick={props.onConditionPillClick} />
        </div>
      ) : null}
    </header>
  );
}
