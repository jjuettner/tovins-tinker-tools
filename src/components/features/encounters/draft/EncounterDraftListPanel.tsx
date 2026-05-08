import { buttonClass, highlightButtonClass, inputClassFull, smallLabelClass } from "@/components/ui/controlClasses";
import type { EncounterRow } from "@/lib/db/encounters";

export default function EncounterDraftListPanel(props: {
  rows: EncounterRow[];
  selectedId: string | null;
  loading: boolean;
  newName: string;
  onChangeNewName(next: string): void;
  onCreateDraft(): void;
  onSelectEncounter(id: string): void;
}) {
  return (
    <section className="flex flex-col rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 lg:max-h-[600px] [@media(min-width:1800px)]:max-h-[calc(100dvh-10rem)] [@media(min-width:1800px)]:sticky [@media(min-width:1800px)]:top-6">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Encounters</h2>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span className={smallLabelClass()}>New name</span>
          <input
            className={inputClassFull()}
            value={props.newName}
            onChange={(e) => props.onChangeNewName(e.target.value)}
            disabled={props.loading}
          />
        </label>
        <button type="button" className={buttonClass("primary")} disabled={props.loading} onClick={props.onCreateDraft}>
          Create draft
        </button>
      </div>

      <ul className="mt-3 flex-1 space-y-1 overflow-auto">
        {props.rows.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className={
                "w-full px-2 py-2 text-left " +
                (props.selectedId === r.id
                  ? highlightButtonClass(true)
                  : "rounded-md text-zinc-800 hover:bg-[var(--tovin-highlight-bg-hover)] dark:text-zinc-200")
              }
              onClick={() => props.onSelectEncounter(r.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium">{r.name}</span>
                  <span className="mt-0.5 block text-[11px] text-zinc-500 dark:text-zinc-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid shrink-0 justify-items-end gap-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <div className="min-w-[5.5rem] text-left">
                    <span className="font-medium tabular-nums">{r.data.players.length}</span> PC
                  </div>
                  <div className="min-w-[5.5rem] text-left">
                    <span className="font-medium tabular-nums">
                      {r.data.monsterPicks.reduce((sum, p) => sum + Math.max(0, Math.floor(p.count)), 0)}
                    </span>{" "}
                    enemy
                  </div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

