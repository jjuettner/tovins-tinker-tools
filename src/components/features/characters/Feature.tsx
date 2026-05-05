import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useCharacters } from "../../../hooks/useCharacters";
import { useStoredState } from "../../../hooks/useStoredState";
import { normalizeCharacter } from "../../../lib/characterNormalize";
import { STORAGE_KEYS } from "../../../lib/appConstants";
import type { Character, CharacterDraft } from "../../../types/character";
import { buttonClass } from "../../ui/controlClasses";
import { CharacterEditor } from "./Editor";
import { CharacterList } from "./List";
import { CharacterSheet } from "./Sheet";
import { makeDraft } from "./characterDraft";

function sortByName(a: Character, b: Character) {
  return a.name.localeCompare(b.name);
}

export function CharactersFeature() {
  const { characters, save, remove, loading, error } = useCharacters();
  const { value: usedCharacterId, setValue: setUsedCharacterId } = useStoredState<string | null>(
    STORAGE_KEYS.usedCharacterId,
    null
  );
  const [selectedId, setSelectedId] = useState<string | null>(characters[0]?.id ?? null);
  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
  const [draft, setDraft] = useState<CharacterDraft>(() => makeDraft());

  const selected = useMemo(() => characters.find((c) => c.id === selectedId) ?? null, [characters, selectedId]);
  const sorted = useMemo(() => [...characters].sort(sortByName), [characters]);

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
          <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Characters
          </h1>
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
          selectedId={selectedId}
          usedCharacterId={usedCharacterId}
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
              isPlayTarget={selected.id === usedCharacterId}
              onEdit={() => startEdit(selected)}
              onDelete={removeSelected}
              onUseCharacter={() => setUsedCharacterId(selected.id)}
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

