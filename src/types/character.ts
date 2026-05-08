import type { Ability, Skill } from "@/lib/dnd";

export type EquippedItem = {
  id: string;
  equipmentIndex: string;
  /** Magic bonus (+1 weapon/armor, etc.) applied to attack/damage or AC as appropriate. */
  modifier: number;
  /** Weapon mastery property index (SRD); empty uses weapon default mastery if any. */
  masteryIndex?: string;
  /** When false, ignore weapon's default mastery and any override. */
  masteryProficient?: boolean;
};

export type Character = {
  id: string;
  name: string;
  /** Optional public avatar URL (stored in `characters.data`). */
  avatarUrl?: string | null;
  world: string;
  /**
   * Optional campaign context stored on the DB row (`characters.campaign_id`).
   * The editor uses this to decide which rulesets to show; the editor itself does not
   * currently provide a campaign picker (minimal linkage mode).
   */
  campaignId?: string | null;
  /** SRD race index, e.g. `elf`. */
  raceIndex: string;
  classIndex: string;
  level: number;
  stats: Record<Ability, number>;
  proficientSkills: Skill[];
  proficientSaves: Ability[];
  spells: string[];
  feats: string[];
  maxHp: number;
  currentHp: number;
  tempHp: number;
  armorClass: number;
  equipped: EquippedItem[];
  /** Count of spell slots already spent at each spell level (keys "1"…"9"). */
  spellSlotsUsed: Partial<Record<string, number>>;
  createdAt: number;
  updatedAt: number;
};

export type CharacterDraft = Omit<Character, "createdAt" | "updatedAt">;

