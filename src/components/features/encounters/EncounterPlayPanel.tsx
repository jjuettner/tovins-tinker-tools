import { Droplet, Plus, Skull } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buttonClass, inputClass, smallLabelClass } from "@/components/ui/controlClasses";
import HpReadonlyBadge from "@/components/ui/HpReadonlyBadge";
import { eligibleTurnOrder, normalizeEncounterQueue, orderWithDeadAtBottom, rotateTurnOrder } from "@/lib/encounterTurn";
import { classIconUrl } from "@/lib/classIcons";
import { listCharactersByCampaign } from "@/lib/db/characters";
import { listEncounters, updateEncounter, type EncounterRow } from "@/lib/db/encounters";
import { getMonstersByIds, type MonsterRow } from "@/lib/db/monsters";
import type { Character } from "@/types/character";
import type { EncounterDataV1, EncounterEntity } from "@/types/encounter";

type PreRow = { key: string; label: string };

function initialsForName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashToHue(input: string): number {
  // Deterministic tiny hash -> 0..359 for stable avatar colors.
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h % 360;
}

function avatarStyleForKey(key: string): { backgroundColor: string; color: string } {
  const hue = hashToHue(key);
  // Pastel-ish but readable.
  return { backgroundColor: `hsl(${hue} 70% 40%)`, color: "white" };
}

function buildEntities(
  data: EncounterDataV1,
  initiative: Record<string, number>,
  chars: Character[],
  monsters: Map<string, MonsterRow>
): EncounterEntity[] {
  const entities: EncounterEntity[] = [];
  for (const p of data.players) {
    const c = chars.find((x) => x.id === p.characterId);
    if (!c) continue;
    const key = `pc:${p.characterId}`;
    entities.push({
      id: crypto.randomUUID(),
      kind: "pc",
      displayName: c.name || "Unnamed",
      characterId: c.id,
      initiative: initiative[key] ?? 0,
      maxHp: c.maxHp,
      currentHp: c.currentHp
    });
  }
  for (const pick of data.monsterPicks) {
    const m = monsters.get(pick.monsterId);
    if (!m) continue;
    for (let i = 0; i < pick.count; i++) {
      const key = `m:${pick.monsterId}:${i}`;
      entities.push({
        id: crypto.randomUUID(),
        kind: "monster",
        displayName: pick.count > 1 ? `${m.name} ${i + 1}` : m.name,
        monsterId: m.id,
        initiative: initiative[key] ?? 0,
        maxHp: m.hp,
        currentHp: m.hp
      });
    }
  }
  return entities;
}

export default function EncounterPlayPanel(props: { campaignId: string; encounterId: string | null }) {
  const DEAD_STATUS: EncounterEntity["status"] = "dead";
  const [rows, setRows] = useState<EncounterRow[]>([]);
  const [chars, setChars] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(props.encounterId);
  const [initDraft, setInitDraft] = useState<Record<string, number>>({});
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [dmgByEntity, setDmgByEntity] = useState<Record<string, string>>({});

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

  useEffect(() => {
    setSelectedId(props.encounterId);
  }, [props.encounterId]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const monsterIds = useMemo(() => selected?.data.monsterPicks.map((p) => p.monsterId) ?? [], [selected]);
  const monsterIdsKey = useMemo(() => monsterIds.slice().sort().join(","), [monsterIds]);
  const [monsterById, setMonsterById] = useState<Map<string, MonsterRow>>(new Map());

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

  useEffect(() => {
    setInitDraft({});
    setDmgByEntity({});
    setSelectedEntityId(null);
  }, [selectedId]);

  useEffect(() => {
    // Clear extra selection if it becomes the active entity.
    const active = selected?.data.activeEntityId ?? null;
    if (active && selectedEntityId === active) setSelectedEntityId(null);
  }, [selected?.data.activeEntityId, selectedEntityId]);

  const preRows: PreRow[] = useMemo(() => {
    if (!selected || selected.status !== "draft") return [];
    const out: PreRow[] = [];
    for (const p of selected.data.players) {
      const c = chars.find((x) => x.id === p.characterId);
      out.push({ key: `pc:${p.characterId}`, label: c?.name ?? p.characterId });
    }
    for (const pick of selected.data.monsterPicks) {
      const m = monsterById.get(pick.monsterId);
      const base = m?.name ?? pick.monsterId;
      for (let i = 0; i < pick.count; i++) {
        out.push({
          key: `m:${pick.monsterId}:${i}`,
          label: pick.count > 1 ? `${base} ${i + 1}` : base
        });
      }
    }
    return out;
  }, [selected, chars, monsterById]);

  const activeEntityId = selected?.data.activeEntityId ?? null;
  const expandedEntityIds = useMemo(() => {
    const ids: string[] = [];
    if (activeEntityId) ids.push(activeEntityId);
    if (selectedEntityId && selectedEntityId !== activeEntityId) ids.push(selectedEntityId);
    return ids;
  }, [activeEntityId, selectedEntityId]);

  const expandedEntities = useMemo(() => {
    if (!selected?.data.entities) return [];
    const byId = new Map(selected.data.entities.map((e) => [e.id, e] as const));
    return expandedEntityIds.map((id) => byId.get(id)).filter((e): e is EncounterEntity => Boolean(e));
  }, [expandedEntityIds, selected?.data.entities]);

  const expandedMonsterIds = useMemo(() => {
    return expandedEntities
      .filter((e) => e.kind === "monster")
      .map((e) => e.monsterId)
      .filter((id): id is string => Boolean(id));
  }, [expandedEntities]);

  const [expandedMonstersById, setExpandedMonstersById] = useState<Map<string, MonsterRow>>(new Map());
  const expandedMonsterKey = useMemo(() => expandedMonsterIds.slice().sort().join(","), [expandedMonsterIds]);

  useEffect(() => {
    if (expandedMonsterIds.length === 0) {
      setExpandedMonstersById(new Map());
      return;
    }
    let cancelled = false;
    void getMonstersByIds(expandedMonsterIds).then((m) => {
      if (!cancelled) setExpandedMonstersById(m);
    });
    return () => {
      cancelled = true;
    };
  }, [expandedMonsterKey, expandedMonsterIds]);

  const monsterIdsForAvatars = useMemo(() => {
    const ids =
      selected?.data.entities
        ?.filter((e) => e.kind === "monster" && e.monsterId)
        .map((e) => e.monsterId as string) ?? [];
    return [...new Set(ids)];
  }, [selected?.data.entities]);

  const monsterIdsForAvatarsKey = useMemo(() => monsterIdsForAvatars.slice().sort().join(","), [monsterIdsForAvatars]);
  const [monstersForAvatarsById, setMonstersForAvatarsById] = useState<Map<string, MonsterRow>>(new Map());

  useEffect(() => {
    if (monsterIdsForAvatars.length === 0) {
      setMonstersForAvatarsById(new Map());
      return;
    }
    let cancelled = false;
    void getMonstersByIds(monsterIdsForAvatars).then((m) => {
      if (!cancelled) setMonstersForAvatarsById(m);
    });
    return () => {
      cancelled = true;
    };
  }, [monsterIdsForAvatarsKey, monsterIdsForAvatars]);

  const characterById = useMemo(() => new Map(chars.map((c) => [c.id, c] as const)), [chars]);

  async function persistData(enc: EncounterRow, data: EncounterDataV1) {
    await updateEncounter(enc.id, { data });
    await refresh();
  }

  async function startCombat() {
    if (!selected || selected.status !== "draft") return;
    const entities = buildEntities(selected.data, initDraft, chars, monsterById);
    if (entities.length === 0) {
      setError("Add at least one player or monster in the Draft tab.");
      return;
    }
    setError(null);
    const order = eligibleTurnOrder(entities);
    const activeEntityId = order[0]?.id ?? null;
    const initialEntities = [...entities].sort((a, b) => {
      const aDead = a.status === "dead" || (a.kind === "monster" && a.currentHp === 0);
      const bDead = b.status === "dead" || (b.kind === "monster" && b.currentHp === 0);
      if (aDead !== bDead) return aDead ? 1 : -1;
      return b.initiative - a.initiative || a.id.localeCompare(b.id);
    });
    const next: EncounterDataV1 = {
      ...selected.data,
      round: 1,
      activeEntityId,
      // Initial list order = initiative order (then rotates via Next turn).
      entities: initialEntities
    };
    await updateEncounter(selected.id, { status: "ongoing", data: next });
    await refresh();
  }

  async function nextTurn() {
    if (!selected) return;
    const entities = selected.data.entities ?? [];
    const round = selected.data.round ?? 1;
    const rotated = rotateTurnOrder(entities);
    const nextRound = rotated.wrapped ? round + 1 : round;
    await persistData(selected, { ...selected.data, entities: rotated.entities, activeEntityId: rotated.activeEntityId, round: nextRound });
  }

  async function finishCombat() {
    if (!selected) return;
    await updateEncounter(selected.id, { status: "finished" });
    await refresh();
  }

  async function applyHpDelta(entityId: string, delta: number) {
    if (!selected) return;
    const entitiesRaw: EncounterEntity[] = (selected.data.entities ?? []).map((e) => {
      if (e.id !== entityId) return e;
      const nextHp = Math.min(e.maxHp, Math.max(0, e.currentHp + delta));
      const deathSaves =
        e.kind === "pc" && nextHp === 0 ? (e.deathSaves ?? { successes: 0, fails: 0 }) : undefined;

      // If an entity gains HP, clear "dead" and re-enter rotation.
      // Monsters hit 0 HP become dead immediately.
      const status =
        nextHp > 0 ? undefined : e.kind === "monster" && nextHp === 0 ? DEAD_STATUS : e.status;

      return { ...e, currentHp: nextHp, status, deathSaves };
    });
    // HP changes (including deaths) should not reshuffle the live queue.
    const entities = orderWithDeadAtBottom(entitiesRaw);
    await persistData(selected, { ...selected.data, entities });
    setDmgByEntity((d) => ({ ...d, [entityId]: "" }));
  }

  async function setInitiative(entityId: string, value: number) {
    if (!selected) return;
    const n = Math.floor(value);
    const updated = (selected.data.entities ?? []).map((e) => (e.id === entityId ? { ...e, initiative: n } : e));
    const entities = normalizeEncounterQueue(updated, selected.data.activeEntityId ?? null);
    await persistData(selected, { ...selected.data, entities });
  }

  async function applyDeathSave(kind: "success" | "fail") {
    if (!selected) return;
    if (!selected.data.entities || !selected.data.activeEntityId) return;
    const updatedRaw: EncounterEntity[] = selected.data.entities.map((e) => {
      if (e.id !== selected.data.activeEntityId) return e;
      if (e.kind !== "pc" || e.currentHp !== 0 || e.status === "dead") return e;
      const base = e.deathSaves ?? { successes: 0, fails: 0 };
      const next = {
        successes: kind === "success" ? Math.min(3, base.successes + 1) : base.successes,
        fails: kind === "fail" ? Math.min(3, base.fails + 1) : base.fails
      };
      if (next.fails >= 3) return { ...e, status: DEAD_STATUS, deathSaves: next };
      if (next.successes >= 3) return { ...e, currentHp: 1, status: undefined, deathSaves: undefined };
      return { ...e, deathSaves: next };
    });
    const updated = orderWithDeadAtBottom(updatedRaw);

    // Success/fail ends their turn immediately.
    const rotated = rotateTurnOrder(updated);
    const round = selected.data.round ?? 1;
    const nextRound = rotated.wrapped ? round + 1 : round;
    await persistData(selected, {
      ...selected.data,
      entities: rotated.entities,
      activeEntityId: rotated.activeEntityId,
      round: nextRound
    });
  }

  const sortedCombat = useMemo(() => {
    if (!selected?.data.entities) return [];
    return selected.data.entities;
  }, [selected?.data.entities]);

  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (error && !selected) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="flex flex-col gap-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!selectedId ? (
        <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
          Select an encounter in the Draft tab, then click <span className="font-medium">Run</span>.
        </section>
      ) : null}

      {selected && selected.status === "draft" ? (
        <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Before start — set initiative</h3>
          <p className="mt-1 text-xs text-zinc-500">Initiative 0 = standby (skipped in turn order).</p>
          {preRows.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No participants yet. Use the Draft tab.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {preRows.map((row) => (
                <li key={row.key} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="min-w-[10rem] font-medium text-zinc-900 dark:text-zinc-50">{row.label}</span>
                  <label className="flex items-center gap-1 text-zinc-600">
                    <span className={smallLabelClass()}>Init</span>
                    <input
                      type="number"
                      className={inputClass() + " w-20"}
                      value={initDraft[row.key] ?? 0}
                      onChange={(e) =>
                        setInitDraft((m) => ({ ...m, [row.key]: Number.isFinite(Number(e.target.value)) ? Number(e.target.value) : 0 }))
                      }
                    />
                  </label>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className={buttonClass("primary") + " mt-4"} onClick={() => void startCombat()}>
            Start combat
          </button>
        </section>
      ) : null}

      {selected && (selected.status === "ongoing" || selected.status === "finished") ? (
        <>
          <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Round <span className="tabular-nums">{selected.data.round ?? 1}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={buttonClass("primary")}
                  onClick={() => void nextTurn()}
                  disabled={selected.status === "finished"}
                >
                  Next turn
                </button>
                <button type="button" className={buttonClass("ghost")} onClick={() => void finishCombat()}>
                  Finish
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Active:{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {(selected.data.entities ?? []).find((e) => e.id === selected.data.activeEntityId)?.displayName ?? "—"}
              </span>
            </p>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Combatants</h3>
            <ul className="mt-3 space-y-3">
              {sortedCombat.map((e) => {
                const isActive = e.id === selected.data.activeEntityId;
                const isSelected = e.id === selectedEntityId;
                const isExpanded = isActive || isSelected;
                const dmgVal = dmgByEntity[e.id] ?? "";
                const monsterAvatar = e.kind === "monster" && e.monsterId ? monstersForAvatarsById.get(e.monsterId)?.img_url ?? null : null;
                const pcClassIndex = e.kind === "pc" && e.characterId ? characterById.get(e.characterId)?.classIndex ?? "" : "";
                const pcIcon = e.kind === "pc" ? classIconUrl(pcClassIndex) : null;
                return (
                  <li
                    key={e.id}
                    className={
                      "rounded-lg border p-3 dark:border-zinc-800 " +
                      (isActive
                        ? "border-emerald-400 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20"
                        : isSelected
                          ? "border-zinc-400 bg-zinc-50/60 dark:border-zinc-700 dark:bg-zinc-950/20"
                          : "border-zinc-200")
                    }
                    onClick={() => {
                      if (e.id === activeEntityId) return;
                      setSelectedEntityId((cur) => (cur === e.id ? null : e.id));
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative h-14 w-14 shrink-0">
                        <div
                          className={
                            "pointer-events-none absolute left-0 top-[-14px] h-[64px] w-14 overflow-hidden border-2 shadow-sm " +
                            "rounded-t-full rounded-b-none " +
                            (isActive
                              ? "bg-emerald-50 dark:bg-emerald-950/30"
                              : isSelected
                                ? "bg-zinc-50 dark:bg-zinc-950/25"
                                : "bg-white dark:bg-zinc-950/20") +
                            " " +
                            (e.kind === "pc"
                              ? "border-amber-300 dark:border-amber-500"
                              : "border-zinc-300 dark:border-zinc-600")
                          }
                        >
                          <div className="absolute inset-x-0 bottom-0 h-3 bg-zinc-950/10 dark:bg-white/10" />
                          <div className="absolute inset-0 pb-1">
                            {monsterAvatar ? (
                              <img src={monsterAvatar} alt="" className="h-full w-full object-cover" />
                            ) : pcIcon ? (
                              <div
                                className="h-full w-full"
                                style={avatarStyleForKey(e.characterId ?? e.id)}
                              >
                                <img
                                  src={pcIcon}
                                  alt=""
                                  className="h-full w-full object-contain p-1.5 opacity-95 dark:invert"
                                />
                              </div>
                            ) : (
                              <div
                                className={
                                  "grid h-full w-full place-items-center text-base font-semibold"
                                }
                                style={avatarStyleForKey((e.kind === "pc" ? e.characterId : e.monsterId) ?? e.id)}
                              >
                                {initialsForName(e.displayName)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{e.displayName}</span>
                          {e.status === "dead" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                              <Skull className="h-3.5 w-3.5" aria-hidden="true" /> dead
                            </span>
                          ) : null}
                          {e.status !== "dead" && e.currentHp === 0 ? (
                            <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                              downed
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1">
                          <HpReadonlyBadge currentHp={e.currentHp} maxHp={e.maxHp} />
                        </div>
                      </div>
                      <label className="flex items-center gap-1 text-sm text-zinc-600" onClick={(ev) => ev.stopPropagation()}>
                        <span className={smallLabelClass()}>Init</span>
                        <input
                          key={`init-${e.id}-${e.initiative}`}
                          type="number"
                          className={inputClass() + " w-20"}
                          disabled={selected.status === "finished"}
                          defaultValue={e.initiative}
                          onBlur={(ev) => {
                            const v = Math.floor(Number(ev.target.value));
                            if (!Number.isFinite(v) || v === e.initiative) return;
                            void setInitiative(e.id, v);
                          }}
                        />
                      </label>
                      <div className="flex flex-wrap items-end gap-1" onClick={(ev) => ev.stopPropagation()}>
                        <input
                          type="number"
                          min={0}
                          className={inputClass() + " w-20"}
                          disabled={selected.status === "finished"}
                          placeholder="±"
                          value={dmgVal}
                          onChange={(ev) => setDmgByEntity((d) => ({ ...d, [e.id]: ev.target.value }))}
                        />
                        <button
                          type="button"
                          className={buttonClass("ghost") + " inline-flex items-center gap-1 text-xs"}
                          disabled={selected.status === "finished"}
                          onClick={() => {
                            const n = Math.max(0, Math.floor(Number(dmgVal)));
                            if (n <= 0) return;
                            void applyHpDelta(e.id, -n);
                          }}
                          aria-label="Damage"
                        >
                          <Droplet className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
                          DMG
                        </button>
                        <button
                          type="button"
                          className={buttonClass("ghost") + " inline-flex items-center gap-1 text-xs"}
                          disabled={selected.status === "finished"}
                          onClick={() => {
                            const n = Math.max(0, Math.floor(Number(dmgVal)));
                            if (n <= 0) return;
                            void applyHpDelta(e.id, n);
                          }}
                          aria-label="Heal"
                        >
                          <Plus className="h-3.5 w-3.5 text-emerald-600" strokeWidth={7} aria-hidden="true" />
                          Heal
                        </button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="mt-3 border-t border-zinc-200/70 pt-3 dark:border-zinc-800/70">
                        {e.kind === "pc" ? (
                          <div className="space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">PC</div>
                            {isActive && e.currentHp === 0 && e.status !== "dead" ? (
                              <DeathSavesPanel
                                successes={e.deathSaves?.successes ?? 0}
                                fails={e.deathSaves?.fails ?? 0}
                                onSuccess={() => void applyDeathSave("success")}
                                onFail={() => void applyDeathSave("fail")}
                              />
                            ) : null}
                          </div>
                        ) : e.monsterId ? (
                          <div className="space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Monster</div>
                            <ExpandedMonsterCard monsterId={e.monsterId} monstersById={expandedMonstersById} />
                          </div>
                        ) : (
                          <div className="text-sm text-zinc-500">Loading…</div>
                        )}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}

function DeathSavesPanel(props: {
  successes: number;
  fails: number;
  onSuccess(): void;
  onFail(): void;
}) {
  const s = Math.max(0, Math.min(3, Math.floor(props.successes)));
  const f = Math.max(0, Math.min(3, Math.floor(props.fails)));
  return (
    <div className="mt-4 rounded-lg border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/30">
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Death saves</div>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">Success</span>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={
                  "h-3.5 w-3.5 rounded-full border " +
                  (i < s ? "border-emerald-600 bg-emerald-600/20" : "border-emerald-600/60")
                }
                aria-label={i < s ? "success filled" : "success empty"}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">Fail</span>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={
                  "h-3.5 w-3.5 rounded-full border " +
                  (i < f ? "border-red-600 bg-red-600/20" : "border-red-600/60")
                }
                aria-label={i < f ? "fail filled" : "fail empty"}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" className={buttonClass("ghost") + " text-xs"} onClick={props.onSuccess}>
            Success
          </button>
          <button type="button" className={buttonClass("ghost") + " text-xs"} onClick={props.onFail}>
            Fail
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        3 fails = dead. 3 successes = stable (returns to 1 HP).
      </p>
    </div>
  );
}

function ExpandedMonsterCard(props: { monsterId: string; monstersById: Map<string, MonsterRow> }) {
  const m = props.monstersById.get(props.monsterId);
  if (!m) return <div className="text-sm text-zinc-500">Loading…</div>;
  const saveByAbbr = useMemo(() => {
    const out = new Map<string, string>();
    if (!m.saving_throws) return out;
    const parts = m.saving_throws.split(",").map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      const match = /^(STR|DEX|CON|INT|WIS|CHA)\s*([+-]\s*\d+)\b/i.exec(p);
      if (!match) continue;
      out.set(match[1].toUpperCase(), match[2].replace(/\s+/g, ""));
    }
    return out;
  }, [m.saving_throws]);

  const abilities: Array<{ abbr: string; score: number | null; mod: number | null }> = [
    { abbr: "STR", score: m.str, mod: m.str_mod },
    { abbr: "DEX", score: m.dex, mod: m.dex_mod },
    { abbr: "CON", score: m.con, mod: m.con_mod },
    { abbr: "INT", score: m.int, mod: m.int_mod },
    { abbr: "WIS", score: m.wis, mod: m.wis_mod },
    { abbr: "CHA", score: m.cha, mod: m.cha_mod }
  ];
  return (
    <div className="space-y-2">
      <div className="w-full md:float-right md:ml-3 md:mb-2 md:w-[12.5rem]">
        <div className="grid grid-cols-3 gap-2">
          {abilities.map((a) => {
            const save = saveByAbbr.get(a.abbr) ?? null;
            return (
              <div
                key={a.abbr}
                className="rounded-lg border border-zinc-200 bg-white/60 px-2 py-1 text-center dark:border-zinc-800 dark:bg-zinc-950/20"
              >
                <div className="text-[11px] font-semibold text-zinc-500">{a.abbr}</div>
                <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{a.score ?? "—"}</div>
                <div className="text-xs tabular-nums text-zinc-500">
                  {a.mod === null ? "" : a.mod >= 0 ? `+${a.mod}` : `${a.mod}`}
                </div>
                {save ? <div className="mt-0.5 text-[10px] font-medium tabular-nums text-zinc-500">save {save}</div> : null}
              </div>
            );
          })}
        </div>
        {m.skills ? (
          <div className="mt-1 grid justify-items-end gap-0.5 text-xs text-zinc-600 dark:text-zinc-300">
            {m.skills ? (
              <div className="max-w-full text-left">
                <span className="font-semibold">Skills:</span> {m.skills}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {m.actions_html ? (
        <div
          className="monster-html max-h-64 space-y-2 overflow-auto text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [&_p]:my-1"
          dangerouslySetInnerHTML={{ __html: m.actions_html }}
        />
      ) : null}
      <div className="clear-both" />
    </div>
  );
}
