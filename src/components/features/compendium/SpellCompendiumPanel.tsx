import { useEffect, useMemo, useState } from "react";
import { inputClassFull, smallLabelClass } from "@/components/ui/controlClasses";
import { dndClassByIndex, dndClasses, type DndSpell } from "@/lib/dndData";
import type { SpellRow } from "@/lib/db/rulesetCatalog";
import { fetchSpells } from "@/lib/db/rulesetCatalog";
import { listRulesets } from "@/lib/db/rulesets";
import { renderDbDescription } from "@/lib/renderDbDescription";

type LevelFilter = "all" | "cantrip" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

function levelLabel(level: number): string {
  if (level === 0) return "Cantrip";
  return `Level ${level}`;
}

function spellDescriptionText(s: { desc?: string[]; higher_level?: string[] }): string {
  const parts = Array.isArray(s.desc) ? s.desc : [];
  const higher = Array.isArray(s.higher_level) ? s.higher_level : [];
  const joined = [...parts, ...(higher.length ? ["", "At Higher Levels.", ...higher] : [])]
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .join("\n\n");
  return joined;
}

export default function SpellCompendiumPanel() {
  const [search, setSearch] = useState("");
  const [classIndex, setClassIndex] = useState<string>("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spells, setSpells] = useState<DbSpellUi[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const rs = await listRulesets();
        const ids = rs.map((r) => r.id);
        const nameById = new Map(rs.map((r) => [r.id, r.name] as const));
        const rows = await fetchSpells(ids);
        const ui = rows
          .map((row) => spellFromDb(row, nameById.get(row.ruleset_id) ?? row.ruleset_id))
          .filter((x): x is DbSpellUi => Boolean(x));
        if (!cancelled) setSpells(ui);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load spells");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = spells;
    if (classIndex.trim()) {
      const c = classIndex.trim();
      list = list.filter((s) => s.classes.some((x) => x === c));
    }
    if (level !== "all") {
      list =
        level === "cantrip"
          ? list.filter((s) => s.level === 0)
          : list.filter((s) => s.level === Number(level));
    }
    if (q) {
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.index.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      const rn = a.rulesetName.localeCompare(b.rulesetName);
      if (rn !== 0) return rn;
      return a.name.localeCompare(b.name);
    });
  }, [spells, search, level, classIndex]);

  const selected = selectedIndex ? spells.find((s) => s.index === selectedIndex) ?? null : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Spells</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Spells from all rulesets. Filter by class.</p>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <span className={smallLabelClass()}>Search</span>
            <input className={inputClassFull()} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or slug…" />
          </label>
          <label className="flex min-w-[10rem] flex-col gap-1">
            <span className={smallLabelClass()}>Class</span>
            <select className={inputClassFull()} value={classIndex} onChange={(e) => setClassIndex(e.target.value)}>
              <option value="">All</option>
              {dndClasses.map((c) => (
                <option key={c.index} value={c.index}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[9rem] flex-col gap-1">
            <span className={smallLabelClass()}>Level</span>
            <select className={inputClassFull()} value={level} onChange={(e) => setLevel(e.target.value as LevelFilter)}>
              <option value="all">All</option>
              <option value="cantrip">Cantrip</option>
              {(["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const).map((n) => (
                <option key={n} value={n}>
                  Level {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p> : null}
        {loading ? <p className="mt-2 text-sm text-zinc-500">Loading…</p> : null}

        <ul className="mt-3 max-h-[28rem] space-y-1 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          {rows.length === 0 ? (
            <li className="p-3 text-sm text-zinc-500">No matches.</li>
          ) : (
            rows.map((s) => (
              <li key={s.index}>
                <button
                  type="button"
                  className={
                    "w-full rounded-none border-b border-zinc-100 px-2 py-1.5 text-left text-sm last:border-b-0 dark:border-zinc-800 " +
                    (selectedIndex === s.index
                      ? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/60")
                  }
                  onClick={() => setSelectedIndex(s.index)}
                >
                  <span className="block truncate">{s.name}</span>
                  <span className="block truncate text-[11px] font-normal text-zinc-500">
                    {levelLabel(s.level)}
                    {s.school?.name ? ` · ${s.school.name}` : ""}
                    {s.rulesetName ? ` · ${s.rulesetName}` : ""}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Detail</h2>
        {!selected ? (
          <p className="mt-2 text-sm text-zinc-500">Pick a spell from the list.</p>
        ) : (
          <SpellDetailCard spell={selected} />
        )}
      </section>
    </div>
  );
}

type DbSpellUi = Omit<DndSpell, "classes"> & {
  rulesetId: string;
  rulesetName: string;
  classes: string[];
};

function spellFromDb(row: SpellRow, rulesetName: string): DbSpellUi | null {
  const data = row.data as DndSpell;
  const classes = Array.isArray(row.classes) ? row.classes : [];
  const schoolName = row.school ?? (data.school?.name ?? null);
  return {
    ...(data ?? {}),
    index: row.slug,
    name: row.name,
    level: row.level ?? 0,
    school: schoolName ? { index: (data.school?.index ?? ""), name: schoolName } : undefined,
    classes,
    casting_time: row.casting_time ?? data.casting_time,
    range: row.range_text ?? data.range,
    duration: row.duration ?? data.duration,
    concentration: row.concentration ?? data.concentration,
    ritual: row.ritual ?? data.ritual,
    rulesetId: row.ruleset_id,
    rulesetName
  };
}

function SpellDetailCard(props: { spell: DbSpellUi }) {
  const s = props.spell;
  const desc = spellDescriptionText(s);
  const classes = (s.classes ?? []).map((idx) => dndClassByIndex[idx]?.name ?? idx);

  return (
    <div className="mt-3 space-y-4 text-sm text-zinc-700 dark:text-zinc-200">
      <div>
        <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-50">{s.name}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {s.index} · {s.rulesetName}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <dt className="text-xs text-zinc-500">Level</dt>
          <dd className="font-medium">{levelLabel(s.level)}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">School</dt>
          <dd className="font-medium">{s.school?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Casting time</dt>
          <dd className="font-medium">{s.casting_time ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Range</dt>
          <dd className="font-medium">{s.range ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Duration</dt>
          <dd className="font-medium">
            {s.duration ?? "—"}
            {s.concentration ? <span className="text-zinc-500"> · Concentration</span> : null}
            {s.ritual ? <span className="text-zinc-500"> · Ritual</span> : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Classes</dt>
          <dd className="font-medium">{classes.length ? classes.join(", ") : "—"}</dd>
        </div>
      </dl>

      {desc ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Description</h4>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {renderDbDescription(desc)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

