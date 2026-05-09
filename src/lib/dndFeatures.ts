import rawFeatures from "@/data/PHB24/5e-Features.json";

export type BundledClassFeature = {
  index: string;
  name: string;
  level: number;
  class?: { index: string; name?: string };
  subclass?: { index: string; name?: string };
  parent?: { index: string; name?: string };
  desc?: string[];
};

const features = rawFeatures as unknown as BundledClassFeature[];

/**
 * Class features unlocked at this level from bundled PHB24 data: same class, no subclass
 * until we persist subclass (`subclass`), and excludes sub-choice rows (`parent`).
 *
 * @param classIndex Ruleset class slug (e.g. `fighter`).
 * @param level Character class level.
 * @returns Sorted list of unlocked base class features.
 */
export function unlockedBaseClassFeatures(classIndex: string, level: number): BundledClassFeature[] {
  const cid = classIndex.trim();
  if (!cid) return [];
  return features
    .filter(
      (f) =>
        f.class?.index === cid &&
        !f.subclass &&
        !f.parent &&
        typeof f.level === "number" &&
        f.level <= level
    )
    .sort((a, b) => (a.level !== b.level ? a.level - b.level : a.name.localeCompare(b.name)));
}
