import { useCallback, useEffect, useMemo, useState } from "react";
import { CatalogLabeledSelect, CatalogSearchField } from "@/components/features/compendium/CatalogListControls";
import { buttonClass, inputClassFull, smallLabelClass } from "@/components/ui/controlClasses";
import {
  insertAdminFeature,
  listAllAdminFeatures,
  parseDataJson,
  updateAdminFeature,
  type AdminFeatureRow
} from "@/lib/db/adminCatalog";
import type { Ruleset } from "@/lib/db/rulesets";

type AdminFeaturesCrudProps = {
  rulesets: Ruleset[];
};

type FeatureSort = "name-asc" | "name-desc" | "level-asc" | "level-desc";

/**
 * Admin table + form for `public.features`.
 *
 * @param props.rulesets Ruleset list for foreign-key select.
 */
export default function AdminFeaturesCrud(props: AdminFeaturesCrudProps) {
  const [rows, setRows] = useState<AdminFeatureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterRuleset, setFilterRuleset] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [sortKey, setSortKey] = useState<FeatureSort>("name-asc");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [rulesetId, setRulesetId] = useState("");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [classSlug, setClassSlug] = useState("");
  const [subclassSlug, setSubclassSlug] = useState("");
  const [levelStr, setLevelStr] = useState("");
  const [summary, setSummary] = useState("");
  const [dataJson, setDataJson] = useState("{}\n");

  const rulesetNameById = useMemo(() => new Map(props.rulesets.map((r) => [r.id, r.name] as const)), [props.rulesets]);

  const filteredRows = useMemo(() => {
    let list = rows;
    if (filterRuleset.trim()) {
      list = list.filter((r) => r.ruleset_id === filterRuleset);
    }
    if (filterClass.trim()) {
      list = list.filter((r) => (r.class_slug ?? "").trim() === filterClass);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          (r.class_slug ?? "").toLowerCase().includes(q) ||
          (r.summary ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortKey === "level-asc" || sortKey === "level-desc") {
        const aLv = sortKey === "level-desc" ? a.level ?? -1 : a.level ?? 9999;
        const bLv = sortKey === "level-desc" ? b.level ?? -1 : b.level ?? 9999;
        if (aLv !== bLv) return sortKey === "level-desc" ? bLv - aLv : aLv - bLv;
        return a.name.localeCompare(b.name);
      }
      const mul = sortKey === "name-desc" ? -1 : 1;
      return mul * a.name.localeCompare(b.name);
    });
  }, [rows, search, filterRuleset, filterClass, sortKey]);

  const load = useCallback(async (): Promise<AdminFeatureRow[]> => {
    setLoading(true);
    setError(null);
    try {
      const list = await listAllAdminFeatures();
      setRows(list);
      setLoading(false);
      return list;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load features");
      setLoading(false);
      return [];
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function fillFromRow(r: AdminFeatureRow) {
    setSelectedId(r.id);
    setIsNew(false);
    setRulesetId(r.ruleset_id);
    setSlug(r.slug);
    setName(r.name);
    setClassSlug(r.class_slug ?? "");
    setSubclassSlug(r.subclass_slug ?? "");
    setLevelStr(r.level === null || r.level === undefined ? "" : String(r.level));
    setSummary(r.summary ?? "");
    setDataJson(`${JSON.stringify(r.data ?? {}, null, 2)}\n`);
  }

  function startNew() {
    setSelectedId(null);
    setIsNew(true);
    setRulesetId(props.rulesets[0]?.id ?? "");
    setSlug("");
    setName("");
    setClassSlug("");
    setSubclassSlug("");
    setLevelStr("");
    setSummary("");
    setDataJson("{}\n");
  }

  function parseLevel(): number | null {
    const t = levelStr.trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    return Math.floor(n);
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
    const level = parseLevel();
    try {
      if (isNew || !selectedId) {
        const inserted = await insertAdminFeature({
          ruleset_id: rs,
          slug: sl,
          name: nm,
          class_slug: classSlug.trim() || null,
          subclass_slug: subclassSlug.trim() || null,
          level,
          summary: summary.trim() || null,
          data
        });
        const list = await load();
        const fresh = list.find((x) => x.id === inserted.id) ?? inserted;
        fillFromRow(fresh);
      } else {
        const id = selectedId;
        await updateAdminFeature(id, {
          ruleset_id: rs,
          slug: sl,
          name: nm,
          class_slug: classSlug.trim() || null,
          subclass_slug: subclassSlug.trim() || null,
          level,
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

  const classFilterOptions = useMemo(() => {
    const slugs = new Set<string>();
    for (const r of rows) {
      const s = (r.class_slug ?? "").trim();
      if (s) slugs.add(s);
    }
    const sorted = [...slugs].sort((a, b) => a.localeCompare(b));
    return [{ value: "", label: "All classes" }, ...sorted.map((s) => ({ value: s, label: s }))];
  }, [rows]);

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
          Add feature
        </button>
      </div>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p> : null}

      <div className="flex flex-wrap items-end gap-2">
        <CatalogSearchField id="admin-features-search" value={search} onChange={setSearch} />
        <CatalogLabeledSelect
          label="Ruleset"
          value={filterRuleset}
          onChange={setFilterRuleset}
          options={rulesetFilterOptions}
        />
        <CatalogLabeledSelect
          label="Class"
          value={filterClass}
          onChange={setFilterClass}
          options={classFilterOptions}
        />
        <CatalogLabeledSelect
          label="Sort"
          value={sortKey}
          onChange={(v) => setSortKey(v as FeatureSort)}
          options={sortOptions}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="max-h-[min(28rem,50vh)] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[24rem] border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900">
              <tr>
                <th className="border-b border-zinc-200 px-2 py-2 font-medium dark:border-zinc-800">Ruleset</th>
                <th className="border-b border-zinc-200 px-2 py-2 font-medium dark:border-zinc-800">Class</th>
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
                  <td className="px-2 py-1.5 font-mono text-xs">{r.class_slug ?? "—"}</td>
                  <td className="px-2 py-1.5">{r.level ?? "—"}</td>
                  <td className="px-2 py-1.5">{r.name}</td>
                  <td className="max-w-[8rem] truncate px-2 py-1.5 text-xs text-zinc-500 dark:text-zinc-400">{r.summary ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{isNew ? "New feature" : "Edit feature"}</h3>
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
              <span className={smallLabelClass()}>Class slug</span>
              <input className={inputClassFull()} value={classSlug} onChange={(e) => setClassSlug(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>Subclass slug</span>
              <input className={inputClassFull()} value={subclassSlug} onChange={(e) => setSubclassSlug(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={smallLabelClass()}>Level</span>
              <input className={inputClassFull()} type="number" value={levelStr} onChange={(e) => setLevelStr(e.target.value)} />
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
