import { useCallback, useEffect, useState } from "react";
import type { Character } from "../types/character";
import { deleteCharacter, listCharacters, upsertCharacter } from "../lib/db/characters";

export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCharacters();
      setCharacters(data);
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

  return { characters, setCharacters, loading, error, refresh, save, remove } as const;
}

