import type { Ability, Skill } from "../lib/dnd";

export type Character = {
  id: string;
  name: string;
  world: string;
  level: number;
  stats: Record<Ability, number>;
  proficientSkills: Skill[];
  proficientSaves: Ability[];
  createdAt: number;
  updatedAt: number;
};

export type CharacterDraft = Omit<Character, "createdAt" | "updatedAt">;

