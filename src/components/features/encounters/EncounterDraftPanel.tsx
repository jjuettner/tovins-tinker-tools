import { useCallback, useEffect, useMemo, useState } from "react";
import { createEncounter, deleteEncounter, listEncounters, updateEncounter, type EncounterRow } from "@/lib/db/encounters";
import { getMonstersByIds, type MonsterRow } from "@/lib/db/monsters";
import { orderWithDeadAtBottom } from "@/lib/encounterTurn";
import { listCharactersByCampaign } from "@/lib/db/characters";
import type { Character } from "@/types/character";
import type { EncounterDataV1, EncounterEntity } from "@/types/encounter";
import { emptyEncounterDataV1 } from "@/types/encounter";
import EncounterDraftInfoPanel from "@/components/features/encounters/draft/EncounterDraftInfoPanel";
import EncounterDraftListPanel from "@/components/features/encounters/draft/EncounterDraftListPanel";
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
        currentHp: c.currentHp,
        tempHp: c.tempHp
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
    <div className="relative">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {overlay}
      <div className="flex flex-col gap-6 [@media(min-width:1800px)]:relative [@media(min-width:1800px)]:block [@media(min-width:1800px)]:min-h-[calc(100dvh-10rem)]">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start [@media(min-width:1800px)]:contents">
          <div className="[@media(min-width:1800px)]:absolute [@media(min-width:1800px)]:left-[calc(-1*max(0px,(100vw-72rem)/2)+16px)] [@media(min-width:1800px)]:top-0 [@media(min-width:1800px)]:w-[320px]">
            <EncounterDraftListPanel
              rows={rows}
              selectedId={selectedId}
              loading={loading}
              newName={newName}
              onChangeNewName={setNewName}
              onCreateDraft={async () => {
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
              onSelectEncounter={setSelectedId}
            />
          </div>

          <div className="[@media(min-width:1800px)]:absolute [@media(min-width:1800px)]:right-[calc(-1*max(0px,(100vw-72rem)/2)+16px)] [@media(min-width:1800px)]:top-0 [@media(min-width:1800px)]:w-[320px]">
            <EncounterDraftInfoPanel
              selected={selected}
              loading={loading}
              chars={chars}
              monsterById={monsterById}
              renameDraft={renameDraft}
              onChangeRenameDraft={setRenameDraft}
              onCommitRename={async (raw) => {
                if (!selected) return;
                const t = raw.trim();
                if (!t || t === selected.name) return;
                await updateEncounter(selected.id, { name: t });
                await refresh();
              }}
              crTotal={crTotal}
              onRunEncounter={() => {
                if (!selected) return;
                props.onRunEncounter(selected.id);
              }}
              onChangeStatus={async (next) => {
                if (!selected) return;
                await updateEncounter(selected.id, { status: next });
                await refresh();
              }}
              onDeleteEncounter={async () => {
                if (!selected) return;
                if (!window.confirm("Delete this encounter?")) return;
                await deleteEncounter(selected.id);
                setSelectedId(null);
                await refresh();
              }}
              onTogglePlayer={togglePlayer}
              onSetPickCount={setPickCount}
              onRemovePick={removePick}
            />
          </div>
        </div>

        {selected ? (
          <MonsterCompendiumPanel onPickMonster={(m) => addMonsterPick(m.id)} pickLabel="Add" />
        ) : (
          <section className="rounded-xl border border-zinc-200 bg-white/40 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-400">
            Select an encounter to browse the monster compendium.
          </section>
        )}
      </div>
    </div>
  );
}
