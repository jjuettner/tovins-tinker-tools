import MonsterCompendiumPanel from "@/components/features/encounters/MonsterCompendiumPanel";
import { highlightButtonClass } from "@/components/ui/controlClasses";

export function CompendiumPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Compendium</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Tabs for reference content. Monsters only (for now).</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        <button
          type="button"
          className={highlightButtonClass(true)}
          aria-current="page"
        >
          Monsters
        </button>
      </div>

      <MonsterCompendiumPanel />
    </div>
  );
}

