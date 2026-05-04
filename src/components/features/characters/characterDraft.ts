import type { Ability } from "../../../lib/dnd";
import type { Character, CharacterDraft } from "../../../types/character";

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultStats(): Record<Ability, number> {
  return { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
}

export function makeDraft(partial?: Partial<CharacterDraft>): CharacterDraft {
  return {
    id: partial?.id ?? newId(),
    name: partial?.name ?? "",
    world: partial?.world ?? "",
    classIndex: partial?.classIndex ?? "",
    level: partial?.level ?? 1,
    stats: partial?.stats ?? defaultStats(),
    proficientSkills: partial?.proficientSkills ?? [],
    proficientSaves: partial?.proficientSaves ?? [],
    spells: partial?.spells ?? [],
    feats: partial?.feats ?? []
  };
}

export function fromCharacter(c: Character): CharacterDraft {
  return makeDraft(c);
}

