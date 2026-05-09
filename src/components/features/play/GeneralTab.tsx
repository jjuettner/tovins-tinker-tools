import { useMemo } from "react";
import { SkillCheckList } from "@/components/features/characters/SkillCheckList";
import { dndTraitByIndex } from "@/lib/dndTraits";
import { unlockedBaseClassFeaturesFromSrd } from "@/lib/dndFeatures";
import { renderDbDescription } from "@/lib/renderDbDescription";
import type { Character } from "@/types/character";

export default function GeneralTab(props: {
  c: Character;
  raceByIndex: Record<string, import("@/lib/dndRaces").DndRace>;
  featByIndex: Record<string, import("@/lib/dndData").DndFeat>;
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

  const srdClassFeatures = useMemo(
    () => unlockedBaseClassFeaturesFromSrd(props.c.classIndex, props.c.level),
    [props.c.classIndex, props.c.level]
  );

  return (
    <div className="space-y-8">
      <SkillCheckList c={props.c} twoColumnAbilityGridFrom="md" />

      {srdClassFeatures.length > 0 ? (
        <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Class features (SRD)</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            From 5e-SRD-Features for your class and level. Subclass paths omitted until a subclass is stored on the character.
          </p>
          <ul className="mt-3 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
            {srdClassFeatures.map((row) => (
              <li key={row.index}>
                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                  <span className="text-zinc-500 dark:text-zinc-400">Lv {row.level}</span> · {row.name}
                </div>
                {row.desc?.length ? (
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {renderDbDescription(row.desc.join("\n\n"))}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
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

