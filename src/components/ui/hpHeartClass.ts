import type { Character } from "@/types/character";

export type HpHeartInput = {
  currentHp: number;
  maxHp: number;
};

/**
 * Tailwind text color classes for HP ratio (heart display).
 *
 * @param hp Current and max HP.
 * @returns Class string for text color.
 */
export function hpHeartClassForValues(hp: HpHeartInput): string {
  const max = Math.max(1, hp.maxHp);
  const cur = Math.min(max, Math.max(0, hp.currentHp));
  const ratio = cur / max;
  if (ratio > 0.5) return "text-emerald-600 dark:text-emerald-400";
  if (ratio > 0.25) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

/**
 * Same as {@link hpHeartClassForValues} using a full character sheet.
 *
 * @param c Character.
 * @returns Class string for text color.
 */
export function hpHeartClass(c: Character): string {
  return hpHeartClassForValues({ currentHp: c.currentHp, maxHp: c.maxHp });
}
