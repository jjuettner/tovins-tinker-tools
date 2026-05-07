import { useCallback, useEffect, useMemo, useState } from "react";
import { buttonClass, inputClass, inputClassFull, smallLabelClass } from "@/components/ui/controlClasses";
import { createEncounter, deleteEncounter, listEncounters, updateEncounter, type EncounterRow } from "@/lib/db/encounters";
import { getMonstersByIds, type MonsterRow } from "@/lib/db/monsters";
import { orderWithDeadAtBottom } from "@/lib/encounterTurn";
import { listCharactersByCampaign } from "@/lib/db/characters";
import type { Character } from "@/types/character";
import type { EncounterDataV1, EncounterEntity } from "@/types/encounter";
import { emptyEncounterDataV1 } from "@/types/encounter";
import MonsterCompendiumPanel from "@/components/features/encounters/MonsterCompendiumPanel";

export default function EncounterDraftPanel(props: { campaignId: string; onRunEncounter(encounterId: string): void }) {
  const [rows, setRows] = useState<EncounterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("New encounter");
  const [chars, setChars] = useState<Character[]>([]);

  const existingNames = useMemo(() => new Set(rows.map((r) => r.name.trim()).filter(Boolean)), [rows]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [encs, ch] = await Promise.all([listEncounters(props.campaignId), listCharactersByCampaign(props.campaignId)]);
      setRows(encs);
      setChars(ch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [props.campaignId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const [renameDraft, setRenameDraft] = useState("");

  useEffect(() => {
    if (selected) setRenameDraft(selected.name);
  }, [selected, selected?.id, selected?.name]);

  const monsterIds = useMemo(() => selected?.data.monsterPicks.map((p) => p.monsterId) ?? [], [selected]);
  const [monsterById, setMonsterById] = useState<Map<string, MonsterRow>>(new Map());

  const monsterIdsKey = useMemo(() => monsterIds.slice().sort().join(","), [monsterIds]);

  useEffect(() => {
    if (monsterIds.length === 0) {
      setMonsterById(new Map());
      return;
    }
    let cancelled = false;
    void getMonstersByIds(monsterIds).then((m) => {
      if (!cancelled) setMonsterById(m);
    });
    return () => {
      cancelled = true;
    };
  }, [monsterIdsKey, monsterIds]);

  const crTotal = useMemo(() => {
    if (!selected) return 0;
    let sum = 0;
    for (const p of selected.data.monsterPicks) {
      const m = monsterById.get(p.monsterId);
      if (m) sum += p.count * Number(m.cr);
    }
    return sum;
  }, [selected, monsterById]);

  async function applyOngoingAdditions(current: EncounterRow, next: EncounterDataV1): Promise<EncounterDataV1> {
    if (current.status !== "ongoing") return next;
    const existing = current.data.entities ?? [];
    if (existing.length === 0) return next;

    // Ensure we can resolve monster HP/name for new picks.
    const wantMonsterIds = [...new Set(next.monsterPicks.map((p) => p.monsterId))];
    const missing = wantMonsterIds.filter((id) => !monsterById.has(id));
    const extraMonsters = missing.length > 0 ? await getMonstersByIds(missing) : new Map<string, MonsterRow>();
    const getMonster = (id: string) => monsterById.get(id) ?? extraMonsters.get(id) ?? null;

    const charById = new Map(chars.map((c) => [c.id, c] as const));

    const added: EncounterEntity[] = [];

    // Add missing PCs.
    for (const p of next.players) {
      const already = existing.some((e) => e.kind === "pc" && e.characterId === p.characterId);
      if (already) continue;
      const c = charById.get(p.characterId);
      if (!c) continue;
      added.push({
        id: crypto.randomUUID(),
        kind: "pc",
        displayName: c.name || "Unnamed",
        characterId: c.id,
        initiative: 0,
        maxHp: c.maxHp,
        currentHp: c.currentHp
      });
    }

    // Add new monster instances (by count diff).
    const existingCountByMonsterId = new Map<string, number>();
    for (const e of existing) {
      if (e.kind !== "monster" || !e.monsterId) continue;
      existingCountByMonsterId.set(e.monsterId, (existingCountByMonsterId.get(e.monsterId) ?? 0) + 1);
    }

    for (const pick of next.monsterPicks) {
      const m = getMonster(pick.monsterId);
      if (!m) continue;
      const have = existingCountByMonsterId.get(pick.monsterId) ?? 0;
      const want = Math.max(0, Math.floor(pick.count));
      const toAdd = Math.max(0, want - have);
      for (let i = 0; i < toAdd; i++) {
        const n = have + i + 1;
        added.push({
          id: crypto.randomUUID(),
          kind: "monster",
          displayName: want > 1 ? `${m.name} ${n}` : m.name,
          monsterId: m.id,
          initiative: 0,
          maxHp: m.hp,
          currentHp: m.hp
        });
      }
    }

    if (added.length === 0) return next;

    const merged = orderWithDeadAtBottom([...existing, ...added]);
    return { ...next, entities: merged, activeEntityId: next.activeEntityId ?? current.data.activeEntityId ?? null };
  }

  async function saveData(next: EncounterDataV1) {
    if (!selected) return;
    const patched = await applyOngoingAdditions(selected, next);
    await updateEncounter(selected.id, { data: patched });
    await refresh();
  }

  function togglePlayer(characterId: string) {
    if (!selected) return;
    const players = [...selected.data.players];
    const i = players.findIndex((p) => p.characterId === characterId);
    if (i >= 0) players.splice(i, 1);
    else players.push({ characterId });
    void saveData({ ...selected.data, players });
  }

  function addMonsterPick(monsterId: string) {
    if (!selected) return;
    const picks = [...selected.data.monsterPicks];
    const idx = picks.findIndex((p) => p.monsterId === monsterId);
    if (idx >= 0) picks[idx] = { ...picks[idx], count: picks[idx].count + 1 };
    else picks.push({ monsterId, count: 1 });
    void saveData({ ...selected.data, monsterPicks: picks });
  }

  function setPickCount(monsterId: string, count: number) {
    if (!selected) return;
    const n = Math.max(1, Math.floor(count));
    const picks = selected.data.monsterPicks.map((p) => (p.monsterId === monsterId ? { ...p, count: n } : p));
    void saveData({ ...selected.data, monsterPicks: picks });
  }

  function removePick(monsterId: string) {
    if (!selected) return;
    const picks = selected.data.monsterPicks.filter((p) => p.monsterId !== monsterId);
    void saveData({ ...selected.data, monsterPicks: picks });
  }

  function uniqueEncounterName(raw: string): string {
    const base = raw.trim() || "Untitled";
    if (!existingNames.has(base)) return base;
    for (let i = 2; i < 1000; i++) {
      const candidate = `${base} (${i})`;
      if (!existingNames.has(candidate)) return candidate;
    }
    return `${base} (${Date.now()})`;
  }

  const overlay = loading ? (
    <div className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-white/50 backdrop-blur-sm dark:bg-zinc-950/30">
      <div className="flex h-full items-center justify-center text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Loading…
      </div>
    </div>
  ) : null;

  return (
    <div className="relative flex flex-col gap-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {overlay}
      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Encounters</h2>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex min-w-[12rem] flex-col gap-1">
            <span className={smallLabelClass()}>New name</span>
            <input className={inputClassFull()} value={newName} onChange={(e) => setNewName(e.target.value)} disabled={loading} />
          </label>
          <button
            type="button"
            className={buttonClass("primary")}
            disabled={loading}
            onClick={async () => {
              const name = uniqueEncounterName(newName);
              const row = await createEncounter({
                campaignId: props.campaignId,
                name,
                data: emptyEncounterDataV1()
              });
              setNewName("New encounter");
              await refresh();
              setSelectedId(row.id);
            }}
          >
            Create draft
          </button>
        </div>
        <ul className="mt-3 max-h-40 space-y-1 overflow-auto">
          {rows.map((r) => (
            <li key={r.id}>
              <div
                className={
                  "flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 " +
                  (selectedId === r.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/60")
                }
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setSelectedId(r.id)}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="truncate text-sm font-medium">{r.name}</span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {r.data.players.length} PC ·{" "}
                      {r.data.monsterPicks.reduce((sum, p) => sum + Math.max(0, Math.floor(p.count)), 0)} enemy
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </button>
                <button
                  type="button"
                  className={buttonClass("primary") + " h-8 px-2 py-0 text-xs"}
                  disabled={loading}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    props.onRunEncounter(r.id);
                  }}
                >
                  Run
                </button>
                <label className="flex items-center gap-1">
                  <span className="text-[11px] font-medium opacity-80">Status</span>
                  <select
                    className={inputClass() + " h-8 py-0 text-xs"}
                    value={r.status}
                        disabled={loading}
                    onChange={async (e) => {
                      await updateEncounter(r.id, { status: e.target.value as EncounterRow["status"] });
                      await refresh();
                    }}
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <option value="draft">draft</option>
                    <option value="ongoing">ongoing</option>
                    <option value="finished">finished</option>
                  </select>
                </label>
                <button
                  type="button"
                  className={buttonClass("ghost") + " h-8 px-2 py-0 text-xs"}
                      disabled={loading}
                  onClick={async (ev) => {
                    ev.stopPropagation();
                    if (!window.confirm("Delete this encounter?")) return;
                    await deleteEncounter(r.id);
                    if (selectedId === r.id) setSelectedId(null);
                    await refresh();
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {selected ? (
        <>
          <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
                <span className={smallLabelClass()}>Encounter name</span>
                <input
                  className={inputClassFull()}
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  disabled={loading}
                  onBlur={async () => {
                    const t = renameDraft.trim();
                    if (!t || t === selected.name) return;
                    await updateEncounter(selected.id, { name: t });
                    await refresh();
                  }}
                />
              </label>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Combined monster CR (approx.): <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{crTotal}</span>
            </p>

            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Players (campaign characters)</h3>
            {chars.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-500">No characters in this campaign.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {chars.map((c) => {
                  const on = selected.data.players.some((p) => p.characterId === c.id);
                  return (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                        <input type="checkbox" checked={on} onChange={() => togglePlayer(c.id)} disabled={loading} />
                        {c.name || "Unnamed"}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}

            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Monsters in encounter</h3>
            {selected.data.monsterPicks.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-500">Use the compendium below to add monsters.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {selected.data.monsterPicks.map((p) => {
                  const m = monsterById.get(p.monsterId);
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
                          onChange={(e) => setPickCount(p.monsterId, Number(e.target.value))}
                          disabled={loading}
                        />
                      </label>
                      <button type="button" className={buttonClass("ghost")} onClick={() => removePick(p.monsterId)}>
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <MonsterCompendiumPanel onPickMonster={(m) => addMonsterPick(m.id)} pickLabel="Add" />
        </>
      ) : null}
    </div>
  );
}
