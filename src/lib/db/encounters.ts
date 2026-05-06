import { requireSupabase } from "@/lib/supabase";
import type { EncounterDataV1, EncounterEntity } from "@/types/encounter";
import { emptyEncounterDataV1 } from "@/types/encounter";

export type EncounterRow = {
  id: string;
  campaign_id: string;
  name: string;
  status: "draft" | "ongoing" | "finished";
  data: EncounterDataV1;
  created_at: string;
  updated_at: string;
};

function parseData(raw: unknown): EncounterDataV1 {
  const empty = emptyEncounterDataV1();
  if (!raw || typeof raw !== "object") return empty;
  const o = raw as Partial<EncounterDataV1>;
  if (o.schemaVersion !== 1) return empty;

  const players = Array.isArray(o.players) ? o.players.filter((p) => p && typeof p.characterId === "string") : empty.players;
  const monsterPicks = Array.isArray(o.monsterPicks)
    ? o.monsterPicks.filter((p) => p && typeof p.monsterId === "string" && typeof p.count === "number")
    : empty.monsterPicks;

  let entities: EncounterEntity[] | undefined;
  if (Array.isArray(o.entities)) {
    const list: EncounterEntity[] = [];
    for (const e of o.entities) {
      if (!e || typeof e !== "object") continue;
      if (
        typeof e.id !== "string" ||
        (e.kind !== "pc" && e.kind !== "monster") ||
        typeof e.displayName !== "string" ||
        typeof e.initiative !== "number" ||
        typeof e.maxHp !== "number" ||
        typeof e.currentHp !== "number"
      ) {
        continue;
      }
      list.push({
        id: e.id,
        kind: e.kind,
        displayName: e.displayName,
        characterId: typeof e.characterId === "string" ? e.characterId : undefined,
        monsterId: typeof e.monsterId === "string" ? e.monsterId : undefined,
        initiative: e.initiative,
        maxHp: e.maxHp,
        currentHp: e.currentHp,
        status: e.status === "dead" ? "dead" : undefined,
        deathSaves:
          e.deathSaves &&
          typeof e.deathSaves === "object" &&
          typeof e.deathSaves.successes === "number" &&
          typeof e.deathSaves.fails === "number"
            ? { successes: e.deathSaves.successes, fails: e.deathSaves.fails }
            : undefined
      });
    }
    entities = list.length > 0 ? list : undefined;
  }

  const round = typeof o.round === "number" && Number.isFinite(o.round) ? o.round : undefined;
  const activeEntityId =
    o.activeEntityId === null ? null : typeof o.activeEntityId === "string" ? o.activeEntityId : undefined;

  return {
    schemaVersion: 1,
    players,
    monsterPicks,
    entities,
    round,
    activeEntityId
  };
}

/**
 * List encounters for a campaign (newest first).
 *
 * @param campaignId Campaign id.
 * @returns Rows with typed `data`.
 */
export async function listEncounters(campaignId: string): Promise<EncounterRow[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("encounters")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const list = (data ?? []) as Array<Omit<EncounterRow, "data"> & { data: unknown }>;
  return list.map((row) => ({
    ...row,
    data: parseData(row.data)
  }));
}

/**
 * Insert a draft encounter.
 *
 * @param input Campaign, display name, optional initial data.
 * @returns New row.
 */
export async function createEncounter(input: {
  campaignId: string;
  name: string;
  data?: EncounterDataV1;
}): Promise<EncounterRow> {
  const sb = requireSupabase();
  const data = input.data ?? emptyEncounterDataV1();
  const { data: row, error } = await sb
    .from("encounters")
    .insert({
      campaign_id: input.campaignId,
      name: input.name.trim(),
      status: "draft",
      data
    })
    .select("*")
    .single();
  if (error) throw error;
  const r = row as Omit<EncounterRow, "data"> & { data: unknown };
  return { ...r, data: parseData(r.data) };
}

/**
 * Patch encounter fields.
 *
 * @param id Encounter id.
 * @param patch Partial row update (`data` merged replace whole object when provided).
 * @returns Updated row.
 */
export async function updateEncounter(
  id: string,
  patch: Partial<Pick<EncounterRow, "name" | "status" | "data">>
): Promise<EncounterRow> {
  const sb = requireSupabase();
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.data !== undefined) payload.data = patch.data;

  const { data: row, error } = await sb.from("encounters").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  const r = row as Omit<EncounterRow, "data"> & { data: unknown };
  return { ...r, data: parseData(r.data) };
}

/**
 * Delete encounter.
 *
 * @param id Encounter id.
 */
export async function deleteEncounter(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("encounters").delete().eq("id", id);
  if (error) throw error;
}
