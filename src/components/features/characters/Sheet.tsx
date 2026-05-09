import { Pencil, Trash2, UserCircle } from "lucide-react";
import { useMemo } from "react";
import { buttonClass } from "@/components/ui/controlClasses";
import CharacterAvatar from "@/components/ui/CharacterAvatar";
import { useActiveRulesetIds } from "@/hooks/useActiveRulesetIds";
import { formatSigned, proficiencyBonus } from "@/lib/dnd";
import { dndClassByIndex, dndFeatByIndex, dndSpellByIndex, type DndSpell } from "@/lib/dndData";
import { dndRaceByIndex } from "@/lib/dndRaces";
import { renderDbDescription } from "@/lib/renderDbDescription";
import { dndTraitByIndex } from "@/lib/dndTraits";
import type { Character } from "@/types/character";
import { SkillCheckList } from "@/components/features/characters/SkillCheckList";
import { useRulesetCatalog } from "@/hooks/useRulesetCatalog";

function spellsGrouped(spellByIndex: Record<string, DndSpell>, indices: string[]): { level: number; spells: DndSpell[] }[] {
  const list = indices
    .map((idx) => spellByIndex[idx])
    .filter((s): s is DndSpell => Boolean(s));
  list.sort((a, b) => (a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name)));
  const groups = new Map<number, DndSpell[]>();
  for (const s of list) {
    if (!groups.has(s.level)) groups.set(s.level, []);
    groups.get(s.level)!.push(s);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, spells]) => ({ level, spells }));
}

export function CharacterSheet(props: {
  c: Character;
  campaignName?: string | null;
  isPlayTarget?: boolean;
  onEdit(): void;
  onDelete(): void;
  onUseCharacter(): void;
}) {
  const prof = proficiencyBonus(props.c.level);
  const { activeRuleIds } = useActiveRulesetIds(props.c.campaignId ?? null);
  const catalog = useRulesetCatalog(activeRuleIds);

  const className =
    (catalog.loading ? dndClassByIndex : catalog.classesByIndex)[props.c.classIndex]?.name ??
    (props.c.classIndex ? props.c.classIndex : "Class");
  const raceName =
    (catalog.loading ? dndRaceByIndex : catalog.racesByIndex)[props.c.raceIndex]?.name ??
    (props.c.raceIndex ? props.c.raceIndex : null);

  const spellByIndex = catalog.loading ? dndSpellByIndex : catalog.spellsByIndex;
  const spellGroups = useMemo(() => spellsGrouped(spellByIndex, props.c.spells ?? []), [spellByIndex, props.c.spells]);

  const featNames = useMemo(
    () => (props.c.feats ?? []).map((idx) => (catalog.loading ? dndFeatByIndex : catalog.featsByIndex)[idx]?.name ?? idx),
    [catalog.loading, props.c.feats, catalog.featsByIndex]
  );

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

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <CharacterAvatar
            characterId={props.c.id}
            name={props.c.name || "Unnamed"}
            classIndex={props.c.classIndex}
            avatarUrl={props.c.avatarUrl}
            size="lg"
          />
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {props.c.name || "Unnamed character"}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {props.c.campaignId && props.campaignName ? (
                <span className="font-medium">{props.campaignName}</span>
              ) : props.c.world ? (
                <span className="font-medium">{props.c.world}</span>
              ) : (
                <span>World</span>
              )}
              <span className="px-2 text-zinc-400">·</span>
              {raceName ? (
                <>
                  <span className="font-medium">{raceName}</span>
                  <span className="px-2 text-zinc-400">·</span>
                </>
              ) : null}
              <span className="font-medium">{className}</span>
              <span className="px-2 text-zinc-400">·</span>
              <span>Level {props.c.level}</span>
              <span className="px-2 text-zinc-400">·</span>
              <span>Proficiency {formatSigned(prof)}</span>
              <span className="px-2 text-zinc-400">·</span>
              <span>AC {props.c.armorClass ?? 10}</span>
              <span className="px-2 text-zinc-400">·</span>
              <span>
                HP {props.c.currentHp ?? 0}/{props.c.maxHp ?? 0}
                {(props.c.tempHp ?? 0) > 0 ? ` (+${props.c.tempHp} temp)` : ""}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={buttonClass(props.isPlayTarget ? "ghost" : "primary")}
            onClick={props.onUseCharacter}
            disabled={Boolean(props.isPlayTarget)}
            title={props.isPlayTarget ? "Already play character" : "Use in Play mode"}
          >
            <UserCircle className="h-4 w-4" aria-hidden="true" />
            {props.isPlayTarget ? "Playing" : "Use character"}
          </button>
          <button type="button" className={buttonClass("ghost")} onClick={props.onEdit}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </button>
          <button type="button" className={buttonClass("danger")} onClick={props.onDelete}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>

      <div className="mt-5">
        <SkillCheckList c={props.c} collapseByAbility />
      </div>

      {raceTraits.length > 0 ? (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Racial traits</h3>
          <ul className="mt-3 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
            {raceTraits.map((t) => (
              <li key={t.index}>
                <div className="font-medium text-zinc-900 dark:text-zinc-50">{t.name}</div>
                {t.description ? (
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {renderDbDescription(t.description)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Spells</h3>
          {spellGroups.length ? (
            <div className="mt-3 space-y-4 text-sm text-zinc-700 dark:text-zinc-200">
              {spellGroups.map((g) => (
                <div key={g.level}>
                  <div className="border-b border-zinc-200 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    {g.level === 0 ? "Cantrips" : `Level ${g.level}`}
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {g.spells.map((s) => (
                      <li key={s.index}>{s.name}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
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
