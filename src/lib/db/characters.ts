import { requireSupabase } from "../supabase";
import type { Character } from "../../types/character";

export type CharacterRow = {
  id: string;
  owner: string;
  campaign_id: string | null;
  name: string;
  data: unknown;
  created_at: string;
  updated_at: string;
};

export function characterFromRow(row: CharacterRow): Character {
  return { ...(row.data as Character), campaignId: row.campaign_id } as Character;
}

export function characterToRow(c: Character, ownerId: string) {
  return {
    id: c.id,
    owner: ownerId,
    campaign_id: c.campaignId ?? null,
    name: c.name,
    data: c
  } as const;
}

export async function listCharacters(): Promise<Character[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("characters").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data as CharacterRow[]).map(characterFromRow);
}

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

export async function deleteCharacter(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("characters").delete().eq("id", id);
  if (error) throw error;
}

