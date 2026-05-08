import { useCallback, useEffect, useState } from "react";
import type { Character } from "@/types/character";
import { deleteCharacter, listCharacters, upsertCharacter, type CharacterListItem } from "@/lib/db/characters";
import { getProfilesByIds } from "@/lib/db/profiles";

/**
 * CRUD hook for character list.
 *
 * @returns Reactive list + helpers (refresh/save/remove).
 */
export function useCharacters() {
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerLabelById, setOwnerLabelById] = useState<Map<string, string>>(new Map());

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCharacters();
      setCharacters(data);
      const ownerIds = data.map((x) => x.ownerId);
      const profilesById = await getProfilesByIds(ownerIds);
      setOwnerLabelById(
        new Map(
          Array.from(new Set(ownerIds)).map((id) => {
            const p = profilesById.get(id);
            const label = p?.display_name?.trim() ? p.display_name.trim() : id.slice(0, 8);
            return [id, label] as const;
          })
        )
      );
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load characters");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(async (c: Character) => {
    await upsertCharacter(c);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteCharacter(id);
    await refresh();
  }, [refresh]);

  return { characters, ownerLabelById, setCharacters, loading, error, refresh, save, remove } as const;
}

