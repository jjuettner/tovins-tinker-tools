import { dndClassByIndex } from "@/lib/dndData";
import type { Character } from "@/types/character";
import CharacterAvatar from "@/components/ui/CharacterAvatar";

export function CharacterList(props: {
  characters: Character[];
  selectedId: string | null;
  usedCharacterId: string | null;
  campaignNameById: Map<string, string>;
  onSelect(id: string): void;
}) {
  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Characters</h2>
        <span className="text-xs text-zinc-600 dark:text-zinc-300">{props.characters.length}</span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {props.characters.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 p-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
            No characters yet. Hit “Create”.
          </div>
        ) : null}

        {props.characters.map((c) => {
          const active = c.id === props.selectedId;
          const used = c.id === props.usedCharacterId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => props.onSelect(c.id)}
              className={
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition " +
                (active
                  ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  : "border-zinc-200 bg-white/50 text-zinc-700 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-300 dark:hover:bg-zinc-950/40")
              }
            >
              <div className="relative">
                <CharacterAvatar
                  characterId={c.id}
                  name={c.name || "Unnamed"}
                  classIndex={c.classIndex}
                  avatarUrl={c.avatarUrl}
                  size="sm"
                />
                <span
                  className={
                    "absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full " +
                    (used
                      ? "bg-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.4)]"
                      : "border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900")
                  }
                  title={used ? "Play character" : undefined}
                  aria-label={used ? "Play character" : "Not play character"}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{c.name || "Unnamed"}</div>
                <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                  {(c.campaignId ? props.campaignNameById.get(c.campaignId) : null) || c.world || "World"} ·{" "}
                  {dndClassByIndex[c.classIndex]?.name ?? (c.classIndex || "Class")} · L{c.level}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
