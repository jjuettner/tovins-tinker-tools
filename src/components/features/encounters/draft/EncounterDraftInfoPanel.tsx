import { buttonClass, inputClass, inputClassFull, smallLabelClass } from "@/components/ui/controlClasses";
import type { EncounterRow } from "@/lib/db/encounters";
import type { MonsterRow } from "@/lib/db/monsters";
import type { Character } from "@/types/character";

export default function EncounterDraftInfoPanel(props: {
  selected: EncounterRow | null;
  loading: boolean;
  chars: Character[];
  monsterById: Map<string, MonsterRow>;
  renameDraft: string;
  onChangeRenameDraft(next: string): void;
  onCommitRename(name: string): void;
  crTotal: number;
  onRunEncounter(): void;
  onChangeStatus(next: EncounterRow["status"]): void;
  onDeleteEncounter(): void;
  onTogglePlayer(characterId: string): void;
  onSetPickCount(monsterId: string, count: number): void;
  onRemovePick(monsterId: string): void;
}) {
  const enc = props.selected;
  if (!enc) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white/60 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300 [@media(min-width:1800px)]:sticky [@media(min-width:1800px)]:top-6">
        Pick an encounter on the left.
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 [@media(min-width:1800px)]:sticky [@media(min-width:1800px)]:top-6 [@media(min-width:1800px)]:max-h-[calc(100dvh-10rem)] [@media(min-width:1800px)]:overflow-auto">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <span className={smallLabelClass()}>Encounter name</span>
            <input
              className={inputClassFull()}
              value={props.renameDraft}
              onChange={(e) => props.onChangeRenameDraft(e.target.value)}
              disabled={props.loading}
              onBlur={() => props.onCommitRename(props.renameDraft)}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={buttonClass("primary")}
              disabled={props.loading}
              onClick={props.onRunEncounter}
            >
              Run
            </button>
            <label className="flex items-center gap-1">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Status</span>
              <select
                className={inputClass() + " h-10"}
                value={enc.status}
                disabled={props.loading}
                onChange={(e) => props.onChangeStatus(e.target.value as EncounterRow["status"])}
              >
                <option value="draft">draft</option>
                <option value="ongoing">ongoing</option>
                <option value="finished">finished</option>
              </select>
            </label>
            <button
              type="button"
              className={buttonClass("danger")}
              disabled={props.loading}
              onClick={props.onDeleteEncounter}
            >
              Delete
            </button>
          </div>
        </div>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Combined monster CR (approx.):{" "}
          <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{props.crTotal}</span>
        </p>

        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Players (campaign characters)</h3>
        {props.chars.length === 0 ? (
          <p className="mt-1 text-sm text-zinc-500">No characters in this campaign.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {props.chars.map((c) => {
              const on = enc.data.players.some((p) => p.characterId === c.id);
              return (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                    <input type="checkbox" checked={on} onChange={() => props.onTogglePlayer(c.id)} disabled={props.loading} />
                    {c.name || "Unnamed"}
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Monsters in encounter</h3>
        {enc.data.monsterPicks.length === 0 ? (
          <p className="mt-1 text-sm text-zinc-500">Use the compendium below to add monsters.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {enc.data.monsterPicks.map((p) => {
              const m = props.monsterById.get(p.monsterId);
              const label = m?.name ?? p.monsterId;
              return (
                <li key={p.monsterId} className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
                  <span className="min-w-0 flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</span>
                  <label className="flex items-center gap-1 text-sm text-zinc-600">
                    <span className={smallLabelClass()}>Count</span>
                    <input
                      type="number"
                      min={1}
                      className={inputClass() + " w-16"}
                      value={p.count}
                      onChange={(e) => props.onSetPickCount(p.monsterId, Number(e.target.value))}
                      disabled={props.loading}
                    />
                  </label>
                  <button type="button" className={buttonClass("ghost")} onClick={() => props.onRemovePick(p.monsterId)} disabled={props.loading}>
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

