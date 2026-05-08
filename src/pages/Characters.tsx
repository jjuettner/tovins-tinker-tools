import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buttonClass } from "@/components/ui/controlClasses";
import { useCharacters } from "@/hooks/useCharacters";
import { useStoredState } from "@/hooks/useStoredState";
import { makeDraft } from "@/lib/character/draft";
import { normalizeCharacter } from "@/lib/character/normalize";
import { STORAGE_KEYS } from "@/lib/appConstants";
import { listCampaigns } from "@/lib/db/campaigns";
import { useProfile } from "@/lib/auth";
import { CharacterEditor } from "@/components/features/characters/Editor";
import { CharacterList } from "@/components/features/characters/List";
import { CharacterSheet } from "@/components/features/characters/Sheet";
import type { Character, CharacterDraft } from "@/types/character";

function sortByName(a: Character, b: Character) {
  return a.name.localeCompare(b.name);
}

export function CharactersPage() {
  const { profile } = useProfile();
  const { characters, ownerLabelById, save, remove, loading, error } = useCharacters();
  const { value: usedCharacterId, setValue: setUsedCharacterId } = useStoredState<string | null>(STORAGE_KEYS.usedCharacterId, null);
  const { setValue: setUsedCharacterName } = useStoredState<string | null>(STORAGE_KEYS.usedCharacterName, null);
  const { setValue: setUsedCharacterClassIndex } = useStoredState<string | null>(STORAGE_KEYS.usedCharacterClassIndex, null);
  const { setValue: setUsedCharacterAvatarUrl } = useStoredState<string | null>(STORAGE_KEYS.usedCharacterAvatarUrl, null);
  const [selectedId, setSelectedId] = useState<string | null>(characters[0]?.character.id ?? null);
  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
  const [draft, setDraft] = useState<CharacterDraft>(() => makeDraft());
  const [campaignNameById, setCampaignNameById] = useState<Map<string, string>>(new Map());

  const selected = useMemo(() => characters.find((x) => x.character.id === selectedId)?.character ?? null, [characters, selectedId]);
  const sorted = useMemo(() => [...characters].map((x) => x.character).sort(sortByName), [characters]);
  const myId = profile?.id ?? null;
  const adminSections = useMemo(() => {
    if (!profile?.is_admin || !myId) return null;
    const mine = characters.filter((x) => x.ownerId === myId).map((x) => x.character).sort(sortByName);
    const others = characters.filter((x) => x.ownerId !== myId);
    const byOwner = new Map<string, Character[]>();
    for (const it of others) {
      const list = byOwner.get(it.ownerId) ?? [];
      list.push(it.character);
      byOwner.set(it.ownerId, list);
    }
    const otherSections = Array.from(byOwner.entries())
      .map(([ownerId, list]) => ({
        ownerId,
        ownerLabel: ownerLabelById.get(ownerId) ?? ownerId.slice(0, 8),
        characters: list.sort(sortByName)
      }))
      .sort((a, b) => a.ownerLabel.localeCompare(b.ownerLabel));
    return {
      mine,
      others: otherSections
    };
  }, [characters, myId, ownerLabelById, profile?.is_admin]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const cs = await listCampaigns();
        if (cancelled) return;
        setCampaignNameById(new Map(cs.map((c) => [c.id, c.name] as const)));
      } catch {
        if (cancelled) return;
        setCampaignNameById(new Map());
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (usedCharacterId) return;
    const first = sorted[0]?.id;
    if (!first) return;
    setUsedCharacterId(first);
    const c = sorted.find((x) => x.id === first);
    if (c) {
      setUsedCharacterName(c.name || "Unnamed");
      setUsedCharacterClassIndex(c.classIndex);
      setUsedCharacterAvatarUrl(c.avatarUrl ?? null);
    }
  }, [
    sorted,
    usedCharacterId,
    setUsedCharacterAvatarUrl,
    setUsedCharacterClassIndex,
    setUsedCharacterId,
    setUsedCharacterName
  ]);

  function startCreate() {
    setDraft(makeDraft());
    setMode("create");
    setSelectedId(null);
  }

  function startEdit(c: Character) {
    setDraft(makeDraft(c));
    setMode("edit");
    setSelectedId(c.id);
  }

  function saveDraft() {
    const now = Date.now();
    const next: Character = normalizeCharacter({
      ...draft,
      level: Math.min(20, Math.max(1, Math.floor(draft.level || 1))),
      name: draft.name.trim(),
      world: draft.world.trim(),
      raceIndex: draft.raceIndex.trim(),
      classIndex: draft.classIndex.trim(),
      spells: Array.from(new Set((draft.spells ?? []).map((s) => s.trim()).filter(Boolean))),
      feats: Array.from(new Set((draft.feats ?? []).map((f) => f.trim()).filter(Boolean))),
      id: mode === "create" ? crypto.randomUUID() : selected?.id ?? crypto.randomUUID(),
      createdAt: mode === "create" ? now : selected?.createdAt ?? now,
      updatedAt: now
    });

    if (!next.name || !next.classIndex || !next.raceIndex) return;
    void save(next);
    setSelectedId(next.id);
    setMode("view");

    if (next.id === usedCharacterId) {
      setUsedCharacterName(next.name);
      setUsedCharacterClassIndex(next.classIndex);
      setUsedCharacterAvatarUrl(next.avatarUrl ?? null);
    }
  }

  function removeSelected() {
    if (!selected) return;
    void remove(selected.id);
    setSelectedId(null);
    setMode("view");
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Characters</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Stored in <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800/60">Supabase</code>.
            Multiple characters supported.
          </p>
        </div>

        <button type="button" className={buttonClass("primary")} onClick={startCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {loading ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</div>
        ) : error ? (
          <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
        ) : null}

        <CharacterList
          characters={sorted}
          adminSections={adminSections}
          selectedId={selectedId}
          usedCharacterId={usedCharacterId}
          campaignNameById={campaignNameById}
          onSelect={(id) => {
            setSelectedId(id);
            setMode("view");
          }}
        />

        <div className="flex flex-col gap-4">
          {mode === "create" || mode === "edit" ? (
            <CharacterEditor
              draft={draft}
              onChange={setDraft}
              onCancel={() => setMode("view")}
              onSave={saveDraft}
              title={mode === "create" ? "Create character" : "Modify character"}
            />
          ) : selected ? (
            <CharacterSheet
              c={selected}
              campaignName={selected.campaignId ? campaignNameById.get(selected.campaignId) ?? null : null}
              isPlayTarget={selected.id === usedCharacterId}
              onEdit={() => startEdit(selected)}
              onDelete={removeSelected}
              onUseCharacter={() => {
                setUsedCharacterId(selected.id);
                setUsedCharacterName(selected.name || "Unnamed");
                setUsedCharacterClassIndex(selected.classIndex);
                setUsedCharacterAvatarUrl(selected.avatarUrl ?? null);
              }}
            />
          ) : (
            <section className="rounded-2xl border border-zinc-200 bg-white/70 p-8 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
              Pick a character or create one.
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

