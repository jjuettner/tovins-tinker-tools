import type { Ability } from "../../../lib/dnd";
import { normalizeDraft } from "../../../lib/characterNormalize";
import type { Character, CharacterDraft } from "../../../types/character";

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultStats(): Record<Ability, number> {
  return { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
}

export function makeDraft(partial?: Partial<CharacterDraft>): CharacterDraft {
  const raw: CharacterDraft = {
    id: partial?.id ?? newId(),
    name: partial?.name ?? "",
    world: partial?.world ?? "",
    raceIndex: partial?.raceIndex ?? "",
    classIndex: partial?.classIndex ?? "",
    level: partial?.level ?? 1,
    stats: partial?.stats ?? defaultStats(),
    proficientSkills: partial?.proficientSkills ?? [],
    proficientSaves: partial?.proficientSaves ?? [],
    spells: partial?.spells ?? [],
    feats: partial?.feats ?? [],
    maxHp: partial?.maxHp ?? 10,
    currentHp: partial?.currentHp ?? partial?.maxHp ?? 10,
    tempHp: partial?.tempHp ?? 0,
    armorClass: partial?.armorClass ?? 10,
    equipped: partial?.equipped ?? [],
    spellSlotsUsed: partial?.spellSlotsUsed ?? {}
  };
  return normalizeDraft(raw);
}

export function fromCharacter(c: Character): CharacterDraft {
  const { createdAt, updatedAt, ...rest } = c;
  void createdAt;
  void updatedAt;
  return normalizeDraft(rest);
}
