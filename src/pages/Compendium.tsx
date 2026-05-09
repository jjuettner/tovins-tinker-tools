import { useState } from "react";
import EquipmentCompendiumPanel from "@/components/features/compendium/EquipmentCompendiumPanel";
import SpellCompendiumPanel from "@/components/features/compendium/SpellCompendiumPanel";
import MonsterCompendiumPanel from "@/components/features/encounters/MonsterCompendiumPanel";
import { highlightButtonClass } from "@/components/ui/controlClasses";

type CompendiumTab = "monsters" | "equipment" | "spells";

export function CompendiumPage() {
  const [tab, setTab] = useState<CompendiumTab>("monsters");

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Compendium</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Browse reference lists. Monsters from the catalog; equipment from bundled PHB 2024 data.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800" role="tablist" aria-label="Compendium sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "monsters"}
          className={highlightButtonClass(tab === "monsters")}
          onClick={() => setTab("monsters")}
        >
          Monsters
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "equipment"}
          className={highlightButtonClass(tab === "equipment")}
          onClick={() => setTab("equipment")}
        >
          Equipment
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "spells"}
          className={highlightButtonClass(tab === "spells")}
          onClick={() => setTab("spells")}
        >
          Spells
        </button>
      </div>

      {tab === "monsters" ? <MonsterCompendiumPanel /> : tab === "equipment" ? <EquipmentCompendiumPanel /> : <SpellCompendiumPanel />}
    </div>
  );
}

