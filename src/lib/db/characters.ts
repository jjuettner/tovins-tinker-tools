import { normalizeCharacter } from "@/lib/character/normalize";
import { requireSupabase } from "@/lib/supabase";
import { getProfilesByIds } from "@/lib/db/profiles";
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
  const merged: Character = { ...(row.data as Character), campaignId: row.campaign_id };
  return normalizeCharacter(merged);
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
 * List characters for the Characters page.
 *
 * Non-admins only see rows they own. Campaign DMs otherwise receive other users' PCs via RLS;
 * those must not appear here (only in encounter/campaign pickers via `listCharactersByCampaign`).
 *
 * @returns Characters sorted by name.
 */
export async function listCharacters(): Promise<CharacterListItem[]> {
  const sb = requireSupabase();
  const { data: sessionData, error: sessionError } = await sb.auth.getSession();
  if (sessionError) throw sessionError;
  const uid = sessionData.session?.user?.id;
  if (!uid) throw new Error("Not signed in");

  const profiles = await getProfilesByIds([uid]);
  const isAdmin = profiles.get(uid)?.is_admin === true;

  let q = sb.from("characters").select("*").order("name", { ascending: true });
  if (!isAdmin) {
    q = q.eq("owner", uid);
  }
  const { data, error } = await q;
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
 * If the row already exists and belongs to another user, only admins may update it,
 * and the original `owner` is kept (prevents accidental ownership transfer on save).
 *
 * @param c Character to upsert.
 * @returns Nothing.
 * @throws If not signed in, or if a non-admin tries to update another user's character.
 */
export async function upsertCharacter(c: Character): Promise<void> {
  const sb = requireSupabase();
  const { data: sessionData, error: sessionError } = await sb.auth.getSession();
  if (sessionError) throw sessionError;
  const sessionUserId = sessionData.session?.user?.id;
  if (!sessionUserId) throw new Error("Not signed in");

  const { data: existingRow, error: existingError } = await sb
    .from("characters")
    .select("owner")
    .eq("id", c.id)
    .maybeSingle();
  if (existingError) throw existingError;

  const existingOwner =
    existingRow && typeof existingRow === "object" && "owner" in existingRow
      ? (existingRow as { owner: string }).owner
      : undefined;

  let ownerId = sessionUserId;
  if (existingOwner !== undefined && existingOwner !== sessionUserId) {
    const profiles = await getProfilesByIds([sessionUserId]);
    const me = profiles.get(sessionUserId);
    if (!me?.is_admin) {
      throw new Error("You cannot modify a character owned by another account.");
    }
    ownerId = existingOwner;
  }

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

