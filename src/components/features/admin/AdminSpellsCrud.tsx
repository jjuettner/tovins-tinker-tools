import { useCallback, useEffect, useMemo, useState } from "react";
import { CatalogLabeledSelect, CatalogSearchField } from "@/components/features/compendium/CatalogListControls";
import { buttonClass, inputClassFull, smallLabelClass } from "@/components/ui/controlClasses";
import {
  formatClassesCsv,
  insertAdminSpell,
  listAllAdminSpells,
  parseClassesCsv,
  parseDataJson,
  updateAdminSpell,
  type AdminSpellRow
} from "@/lib/db/adminCatalog";
import type { Ruleset } from "@/lib/db/rulesets";

type AdminSpellsCrudProps = {
  rulesets: Ruleset[];
};

type LevelFilter = "all" | "cantrip" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type SpellSort = "name-asc" | "name-desc" | "level-asc" | "level-desc";

/**
 * Admin table + form for `public.spells`.
 *
 * @param props.rulesets Ruleset list for foreign-key select.
 */
export default function AdminSpellsCrud(props: AdminSpellsCrudProps) {
  const [rows, setRows] = useState<AdminSpellRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterRuleset, setFilterRuleset] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [sortKey, setSortKey] = useState<SpellSort>("name-asc");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [rulesetId, setRulesetId] = useState("");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [levelStr, setLevelStr] = useState("0");
  const [school, setSchool] = useState("");
  const [castingTime, setCastingTime] = useState("");
  const [rangeText, setRangeText] = useState("");
  const [duration, setDuration] = useState("");
  const [concentration, setConcentration] = useState(false);
  const [ritual, setRitual] = useState(false);
  const [classesCsv, setClassesCsv] = useState("");
  const [summary, setSummary] = useState("");
  const [dataJson, setDataJson] = useState("{}\n");

  const rulesetNameById = useMemo(() => new Map(props.rulesets.map((r) => [r.id, r.name] as const)), [props.rulesets]);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (filterRuleset.trim()) {
      list = list.filter((r) => r.ruleset_id === filterRuleset);
    }
    if (levelFilter !== "all") {
      list =
        levelFilter === "cantrip"
          ? list.filter((r) => r.level === 0)
          : list.filter((r) => r.level === Number(levelFilter));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          (r.summary ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortKey === "level-asc" || sortKey === "level-desc") {
        if (a.level !== b.level) return sortKey === "level-desc" ? b.level - a.level : a.level - b.level;
        return a.name.localeCompare(b.name);
      }
      const mul = sortKey === "name-desc" ? -1 : 1;
      return mul * a.name.localeCompare(b.name);
    });
  }, [rows, search, filterRuleset, levelFilter, sortKey]);

  const load = useCallback(async (): Promise<AdminSpellRow[]> => {
    setLoading(true);
    setError(null);
    try {
      const list = await listAllAdminSpells();
      setRows(list);
      setLoading(false);
      return list;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load spells");
      setLoading(false);
      return [];
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function fillFromRow(r: AdminSpellRow) {
    setSelectedId(r.id);
    setIsNew(false);
    setRulesetId(r.ruleset_id);
    setSlug(r.slug);
    setName(r.name);
    setLevelStr(String(r.level));
    setSchool(r.school ?? "");
    setCastingTime(r.casting_time ?? "");
    setRangeText(r.range_text ?? "");
    setDuration(r.duration ?? "");
    setConcentration(r.concentration === true);
    setRitual(r.ritual === true);
    setClassesCsv(formatClassesCsv(r.classes));
    setSummary(r.summary ?? "");
    setDataJson(`${JSON.stringify(r.data ?? {}, null, 2)}\n`);
  }

  function startNew() {
    setSelectedId(null);
    setIsNew(true);
    setRulesetId(props.rulesets[0]?.id ?? "");
    setSlug("");
    setName("");
    setLevelStr("0");
    setSchool("");
    setCastingTime("");
    setRangeText("");
    setDuration("");
    setConcentration(false);
    setRitual(false);
    setClassesCsv("");
    setSummary("");
    setDataJson("{}\n");
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    let data: unknown;
    try {
      data = parseDataJson(dataJson, "data");
    } catch (e) {
      setSaving(false);
      setError(e instanceof Error ? e.message : "Invalid JSON");
      return;
    }
    const rs = rulesetId.trim();
    const sl = slug.trim();
    const nm = name.trim();
    if (!rs || !sl || !nm) {
      setSaving(false);
      setError("Ruleset, slug, and name are required.");
      return;
    }
    const lv = Math.floor(Number(levelStr));
    if (!Number.isFinite(lv) || lv < 0 || lv > 9) {
      setSaving(false);
      setError("Level must be a number from 0 to 9.");
      return;
    }
    const classes = parseClassesCsv(classesCsv);
    try {
      if (isNew || !selectedId) {
        const inserted = await insertAdminSpell({
          ruleset_id: rs,
          slug: sl,
          name: nm,
          level: lv,
          school: school.trim() || null,
          casting_time: castingTime.trim() || null,
          range_text: rangeText.trim() || null,
          duration: duration.trim() || null,
          concentration,
          ritual,
          classes,
          summary: summary.trim() || null,
          data
        });
        const list = await load();
        const fresh = list.find((x) => x.id === inserted.id) ?? inserted;
        fillFromRow(fresh);
      } else {
        const id = selectedId;
        await updateAdminSpell(id, {
          ruleset_id: rs,
          slug: sl,
          name: nm,
          level: lv,
          school: school.trim() || null,
          casting_time: castingTime.trim() || null,
          range_text: rangeText.trim() || null,
          duration: duration.trim() || null,
          concentration,
          ritual,
          classes,
          summary: summary.trim() || null,
          data
        });
        const list = await load();
        const fresh = list.find((x) => x.id === id);
        if (fresh) fillFromRow(fresh);
      }
      setSaving(false);
    } catch (e) {
      setSaving(false);
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  const rulesetFilterOptions = useMemo(
    () => [{ value: "", label: "All rulesets" }, ...props.rulesets.map((r) => ({ value: r.id, label: r.name }))],
    [props.rulesets]
  );

  const levelOptions = useMemo(
    () => [
      { value: "all", label: "All levels" },
      { value: "cantrip", label: "Cantrip" },
      ...(["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const).map((n) => ({ value: n, label: `Level ${n}` }))
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      { value: "name-asc", label: "Name A–Z" },
      { value: "name-desc", label: "Name Z–A" },
      { value: "level-asc", label: "Level ↑" },
      { value: "level-desc", label: "Level ↓" }
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={buttonClass("ghost")} onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
        <button type="button" className={buttonClass("primary")} onClick={startNew} disabled={props.rulesets.length === 0}>
          Add spell
        </button>
      </div>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p> : null}

      <div className="flex flex-wrap items-end gap-2">
        <CatalogSearchField id="admin-spells-search" value={search} onChange={setSearch} />
        <CatalogLabeledSelect
          label="Ruleset"
          value={filterRuleset}
          onChange={setFilterRuleset}
          options={rulesetFilterOptions}
        />
        <CatalogLabeledSelect
          label="Level"
          value={levelFilter}
          onChange={(v) => setLevelFilter(v as LevelFilter)}
          options={levelOptions}
        />
        <CatalogLabeledSelect
          label="Sort"
          value={sortKey}
          onChange={(v) => setSortKey(v as SpellSort)}
          options={sortOptions}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="max-h-[min(28rem,50vh)] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[22rem] border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900">
              <tr>
                <th className="border-b border-zinc-200 px-2 py-2 font-medium dark:border-zinc-800">Ruleset</th>
                <th className="border-b border-zinc-200 px-2 py-2 font-medium dark:border-zinc-800">Lvl</th>
                <th className="border-b border-zinc-200 px-2 py-2 font-medium dark:border-zinc-800">Name</th>
                <th className="border-b border-zinc-200 px-2 py-2 font-medium dark:border-zinc-800">Summary</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr
                  key={r.id}
                  className={
                    "cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800/80 dark:hover:bg-zinc-900/40 " +
                    (selectedId === r.id ? "bg-emerald-50 dark:bg-emerald-950/30" : "")
                  }
                  onClick={() => fillFromRow(r)}
                >
                  <td className="px-2 py-1.5 text-zinc-600 dark:text-zinc-400">{rulesetNameById.get(r.ruleset_id) ?? r.ruleset_id}</td>
                  <td className="px-2 py-1.5">{r.level}</td>
                  <td className="px-2 py-1.5">{r.name}</td>
                  <td className="max-w-[8rem] truncate px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400">{r.summary ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{isNew ? "New spell" : "Edit spell"}</h3>
          <div className="mt-3 grid gap-3">
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>Ruleset</span>
              <select className={inputClassFull()} value={rulesetId} onChange={(e) => setRulesetId(e.target.value)}>
                <option value="">—</option>
                {props.rulesets.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>Slug</span>
              <input className={inputClassFull()} value={slug} onChange={(e) => setSlug(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>Name</span>
              <input className={inputClassFull()} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>Summary (Play at-a-glance)</span>
              <textarea className={inputClassFull()} rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>Level (0–9)</span>
              <input className={inputClassFull()} type="number" min={0} max={9} value={levelStr} onChange={(e) => setLevelStr(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>School</span>
              <input className={inputClassFull()} value={school} onChange={(e) => setSchool(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>Casting time</span>
              <input className={inputClassFull()} value={castingTime} onChange={(e) => setCastingTime(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>Range</span>
              <input className={inputClassFull()} value={rangeText} onChange={(e) => setRangeText(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>Duration</span>
              <input className={inputClassFull()} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
              <input type="checkbox" checked={concentration} onChange={(e) => setConcentration(e.target.checked)} />
              Concentration
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
              <input type="checkbox" checked={ritual} onChange={(e) => setRitual(e.target.checked)} />
              Ritual
            </label>
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>Classes (comma-separated slugs)</span>
              <input className={inputClassFull()} value={classesCsv} onChange={(e) => setClassesCsv(e.target.value)} placeholder="wizard, cleric" />
            </label>
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>data (JSON)</span>
              <textarea className={inputClassFull()} rows={8} value={dataJson} onChange={(e) => setDataJson(e.target.value)} spellCheck={false} />
            </label>
            <button type="button" className={buttonClass("primary")} onClick={() => void onSave()} disabled={saving}>
              {saving ? "Saving…" : isNew ? "Create" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
