import rawFeatures from "@/data/PHB24/5e-SRD-Features.json";

export type DndSrdClassFeature = {
  index: string;
  name: string;
  level: number;
  class?: { index: string; name?: string };
  subclass?: { index: string; name?: string };
  parent?: { index: string; name?: string };
  desc?: string[];
};

const features = rawFeatures as unknown as DndSrdClassFeature[];

/**
 * SRD class features unlocked at this level: same class, no subclass (we don't store subclass yet),
 * not a sub-choice row (`parent` — e.g. "Fighting Style: Archery" vs "Fighting Style").
 *
 * @param classIndex SRD class index (e.g. "fighter").
 * @param level Character class level.
 * @returns Sorted list of unlocked base class features.
 */
export function unlockedBaseClassFeaturesFromSrd(classIndex: string, level: number): DndSrdClassFeature[] {
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
