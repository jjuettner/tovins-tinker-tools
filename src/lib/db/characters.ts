import { requireSupabase } from "@/lib/supabase";
import type { Character } from "@/types/character";

export type CharacterRow = {
  id: string;
  owner: string;
  campaign_id: string | null;
  name: string;
  data: unknown;
  created_at: string;
  updated_at: string;
};

export type CharacterListItem = {
  character: Character;
  ownerId: string;
};

/**
 * Convert DB row into app `Character`.
 *
 * Assumption: `row.data` already matches `Character` shape.
 *
 * @param row DB row.
 * @returns App character.
 */
export function characterFromRow(row: CharacterRow): Character {
  return { ...(row.data as Character), campaignId: row.campaign_id } as Character;
}

/**
 * Convert app `Character` into DB upsert payload.
 *
 * @param c App character.
 * @param ownerId User id.
 * @returns Row payload for upsert.
 */
export function characterToRow(c: Character, ownerId: string) {
  return {
    id: c.id,
    owner: ownerId,
    campaign_id: c.campaignId ?? null,
    name: c.name,
    data: c
  } as const;
}

/**
 * List characters for current user.
 *
 * @returns Characters sorted by name.
 */
export async function listCharacters(): Promise<CharacterListItem[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("characters").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data as CharacterRow[]).map((r) => ({ character: characterFromRow(r), ownerId: r.owner }));
}

/**
 * List characters linked to a campaign (for encounter player picks).
 *
 * @param campaignId Campaign id.
 * @returns Characters sorted by name.
 */
export async function listCharactersByCampaign(campaignId: string): Promise<Character[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("characters")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data as CharacterRow[]).map(characterFromRow);
}

/**
 * Insert or update character for current user.
 *
 * @param c Character to upsert.
 * @returns Nothing.
 * @throws If not signed in.
 */
export async function upsertCharacter(c: Character): Promise<void> {
  const sb = requireSupabase();
  const { data: sessionData, error: sessionError } = await sb.auth.getSession();
  if (sessionError) throw sessionError;
  const ownerId = sessionData.session?.user?.id;
  if (!ownerId) throw new Error("Not signed in");

  const row = characterToRow(c, ownerId);
  const { error } = await sb.from("characters").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

/**
 * Delete character by id.
 *
 * @param id Character id.
 * @returns Nothing.
 */
export async function deleteCharacter(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("characters").delete().eq("id", id);
  if (error) throw error;
}

