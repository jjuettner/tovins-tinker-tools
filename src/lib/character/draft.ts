import type { Ability } from "@/lib/dnd";
import { normalizeDraft } from "@/lib/character/normalize";
import type { Character, CharacterDraft } from "@/types/character";
import { newId } from "@/lib/randomId";

/**
 * Default ability scores for new drafts.
 *
 * @returns Ability scores map.
 */
function defaultStats(): Record<Ability, number> {
  return { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
}

/**
 * Create a normalized draft from a partial payload.
 *
 * @param partial Optional overrides (e.g. for "duplicate character" flows).
 * @returns Normalized character draft.
 */
export function makeDraft(partial?: Partial<CharacterDraft>): CharacterDraft {
  const raw: CharacterDraft = {
    id: partial?.id ?? newId(),
    name: partial?.name ?? "",
    world: partial?.world ?? "",
    campaignId: partial?.campaignId ?? null,
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

/**
 * Convert a persisted `Character` into an editable draft.
 *
 * @param c Persisted character.
 * @returns Normalized draft.
 */
export function fromCharacter(c: Character): CharacterDraft {
  const { createdAt, updatedAt, ...rest } = c;
  void createdAt;
  void updatedAt;
  return normalizeDraft(rest);
}

