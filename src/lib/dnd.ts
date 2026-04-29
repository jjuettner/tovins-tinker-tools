export type Ability = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

export type Skill =
  | "Acrobatics"
  | "Animal Handling"
  | "Arcana"
  | "Athletics"
  | "Deception"
  | "History"
  | "Insight"
  | "Intimidation"
  | "Investigation"
  | "Medicine"
  | "Nature"
  | "Perception"
  | "Performance"
  | "Persuasion"
  | "Religion"
  | "Sleight of Hand"
  | "Stealth"
  | "Survival";

export const abilities: Ability[] = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

export const skillAbility: Record<Skill, Ability> = {
  Acrobatics: "DEX",
  "Animal Handling": "WIS",
  Arcana: "INT",
  Athletics: "STR",
  Deception: "CHA",
  History: "INT",
  Insight: "WIS",
  Intimidation: "CHA",
  Investigation: "INT",
  Medicine: "WIS",
  Nature: "INT",
  Perception: "WIS",
  Performance: "CHA",
  Persuasion: "CHA",
  Religion: "INT",
  "Sleight of Hand": "DEX",
  Stealth: "DEX",
  Survival: "WIS"
};

export const skills: Skill[] = Object.keys(skillAbility) as Skill[];

export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.min(20, Math.max(1, Math.floor(level)));
}

export function abilityMod(score: number): number {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.floor((n - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  const lv = clampLevel(level);
  if (lv <= 4) return 2;
  if (lv <= 8) return 3;
  if (lv <= 12) return 4;
  if (lv <= 16) return 5;
  return 6;
}

export function formatSigned(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

