import rawConditions from "@/data/PHB24/5e-SRD-Conditions.json";

export type DndCondition = {
  index: string;
  name: string;
  description: string;
};

const list = (rawConditions as unknown as DndCondition[])
  .filter((c) => typeof c.index === "string" && c.index.trim() && typeof c.name === "string")
  .map((c) => ({
    index: c.index.trim().toLowerCase(),
    name: c.name.trim(),
    description: typeof c.description === "string" ? c.description.trim() : ""
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

/**
 * SRD conditions bundled with the app (fallback when DB catalog is empty).
 */
export const dndConditions: DndCondition[] = list;

export const dndConditionByIndex: Record<string, DndCondition> = Object.fromEntries(list.map((c) => [c.index, c]));
