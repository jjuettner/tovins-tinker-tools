import { Pencil, Trash2 } from "lucide-react";
import type { Character } from "../../../types/character";
import { dndClassByIndex } from "../../../lib/dndData";
import { buttonClass } from "../../ui/controlClasses";

export function CharacterList(props: {
  characters: Character[];
  selectedId: string | null;
  onSelect(id: string): void;
  onEdit(): void;
  onDelete(): void;
  hasSelection: boolean;
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
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => props.onSelect(c.id)}
              className={
                "flex w-full flex-col gap-0.5 rounded-lg border px-3 py-2 text-left transition " +
                (active
                  ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  : "border-zinc-200 bg-white/50 text-zinc-700 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-300 dark:hover:bg-zinc-950/40")
              }
            >
              <span className="truncate text-sm font-semibold">{c.name || "Unnamed"}</span>
              <span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                {c.world || "World"} · {dndClassByIndex[c.classIndex]?.name ?? (c.classIndex || "Class")} · L{c.level}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          className={buttonClass("ghost")}
          disabled={!props.hasSelection}
          onClick={props.onEdit}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          className={buttonClass("danger")}
          disabled={!props.hasSelection}
          onClick={props.onDelete}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete
        </button>
      </div>
    </aside>
  );
}

