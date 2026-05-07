import Artificer from "@/img/Class Icon - Artificer.svg";
import Barbarian from "@/img/Class Icon - Barbarian.svg";
import Bard from "@/img/Class Icon - Bard.svg";
import Cleric from "@/img/Class Icon - Cleric.svg";
import Druid from "@/img/Class Icon - Druid.svg";
import Fighter from "@/img/Class Icon - Fighter.svg";
import Monk from "@/img/Class Icon - Monk.svg";
import Paladin from "@/img/Class Icon - Paladin.svg";
import Ranger from "@/img/Class Icon - Ranger.svg";
import Rogue from "@/img/Class Icon - Rogue.svg";
import Sorcerer from "@/img/Class Icon - Sorcerer.svg";
import Warlock from "@/img/Class Icon - Warlock.svg";
import Wizard from "@/img/Class Icon - Wizard.svg";

/**
 * Map SRD class indexes to bundled class icon images.
 *
 * @param classIndex SRD class index (e.g. `wizard`).
 * @returns Image URL or null if unknown.
 */
export function classIconUrl(classIndex: string): string | null {
  const key = classIndex.trim().toLowerCase();
  const byIndex: Partial<Record<string, string>> = {
    artificer: Artificer,
    barbarian: Barbarian,
    bard: Bard,
    cleric: Cleric,
    druid: Druid,
    fighter: Fighter,
    monk: Monk,
    paladin: Paladin,
    ranger: Ranger,
    rogue: Rogue,
    sorcerer: Sorcerer,
    warlock: Warlock,
    wizard: Wizard
  };
  return byIndex[key] ?? null;
}

