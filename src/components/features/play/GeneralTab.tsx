import { useMemo } from "react";
import { SkillCheckList } from "@/components/features/characters/SkillCheckList";
import { buildSheetPassiveEntries } from "@/lib/character/sheetPassives";
import { dndTraitByIndex } from "@/lib/dndTraits";
import type { FeatureRow } from "@/lib/db/rulesetCatalog";
import { renderDbDescription } from "@/lib/renderDbDescription";
import type { Character } from "@/types/character";
import RulesetFeatureDescription from "@/components/features/play/RulesetFeatureDescription";

export default function GeneralTab(props: {
  c: Character;
  raceByIndex: Record<string, import("@/lib/dndRaces").DndRace>;
  featByIndex: Record<string, import("@/lib/dndData").DndFeat>;
  catalogFeatures: FeatureRow[];
  catalogLoading: boolean;
}) {
  const raceTraits = useMemo(() => {
    const race = props.raceByIndex[props.c.raceIndex];
    if (!race?.traits?.length) return [];
    return race.traits
      .map((t) => {
        const full = dndTraitByIndex[t.index];
        return { index: t.index, name: full?.name ?? t.name, description: full?.description };
      })
      .filter((t) => t.name);
  }, [props.c.raceIndex, props.raceByIndex]);

  const featBlocks = useMemo(
    () =>
      (props.c.feats ?? [])
        .map((i) => props.featByIndex[i])
        .filter((f): f is NonNullable<typeof f> => Boolean(f))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [props.c.feats, props.featByIndex]
  );

  const passiveEntries = useMemo(
    () => buildSheetPassiveEntries(props.c, props.catalogFeatures),
    [props.c, props.catalogFeatures]
  );

  const rulesetClassFeatures = useMemo(
    () => passiveEntries.filter((e) => e.kind === "ruleset-class-feature"),
    [passiveEntries]
  );

  const showRulesetFeaturesBlock = props.catalogLoading || rulesetClassFeatures.length > 0;

  return (
    <div className="space-y-8">
      <SkillCheckList c={props.c} twoColumnAbilityGridFrom="md" />

      {showRulesetFeaturesBlock ? (
        <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Class and subclass features</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            From your campaign rulesets (catalog). Unlocks by class, subclass, and level.
          </p>
          {props.catalogLoading && passiveEntries.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Loading catalog…</p>
          ) : null}

          {rulesetClassFeatures.length > 0 ? (
            <ul className="mt-4 space-y-4 text-sm text-zinc-700 dark:text-zinc-200">
              {rulesetClassFeatures.map((row) => (
                <li key={row.slug}>
                  <div className="flex flex-wrap items-baseline gap-x-2 font-medium text-zinc-900 dark:text-zinc-50">
                    <span>
                      <span className="text-zinc-500 dark:text-zinc-400">Lv {row.level}</span>
                      {" · "}
                      {row.name}
                    </span>
                    {row.subclassPathName ? (
                      <span className="border-l-2 border-teal-500/70 pl-2 text-[11px] font-normal tracking-wide text-teal-900 dark:border-teal-400/80 dark:text-teal-300/95">
                        {row.subclassPathName}
                      </span>
                    ) : null}
                  </div>
                  {row.description ? <RulesetFeatureDescription text={row.description} /> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {raceTraits.length > 0 ? (
        <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Traits</h2>
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
                    {renderDbDescription(f.description)}
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
