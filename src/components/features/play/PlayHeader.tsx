import { Tent } from "lucide-react";
import { buttonClass } from "@/components/ui/controlClasses";
import HpReadonlyBadge from "@/components/ui/HpReadonlyBadge";
import { formatSigned } from "@/lib/dnd";
import { spellAttackAndSaveDcForCharacter } from "@/lib/spellcasting";
import type { Character } from "@/types/character";

export default function PlayHeader(props: {
  c: Character;
  onRest(): void;
  classByIndex: Record<string, import("@/lib/dndData").DndClass>;
  isCaster: boolean;
}) {
  const clsName = props.classByIndex[props.c.classIndex]?.name ?? (props.c.classIndex || "Class");
  const spell = props.isCaster ? spellAttackAndSaveDcForCharacter(props.c) : null;

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
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <HpReadonlyBadge currentHp={props.c.currentHp} maxHp={props.c.maxHp} tempHp={props.c.tempHp} />

            {spell ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                <span className="tabular-nums">
                  Spell atk <span className="font-semibold text-zinc-900 dark:text-zinc-50">{formatSigned(spell.spellAttackMod)}</span>
                </span>
                <span className="tabular-nums">
                  Save DC <span className="font-semibold text-zinc-900 dark:text-zinc-50">{spell.spellSaveDc}</span>
                </span>
              </div>
            ) : null}

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

