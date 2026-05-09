import { useMemo, useState } from "react";
import { inputClassFull, smallLabelClass } from "@/components/ui/controlClasses";
import {
  armorAcRulesText,
  dndEquipment,
  isBodyArmor,
  isShield,
  isWeapon,
  weaponIsVersatile,
  type DndEquipment
} from "@/lib/dndEquipment";
import { stripMarkdownBoldMarkers } from "@/lib/renderDbDescription";

/** High-level grouping for browse filters (shields sit with armor). */
type BrowseKind = "all" | "weapons" | "armor_shields" | "gear";

function browseKind(eq: DndEquipment): Exclude<BrowseKind, "all"> {
  if (isWeapon(eq)) return "weapons";
  if (isBodyArmor(eq) || isShield(eq)) return "armor_shields";
  return "gear";
}

function formatCost(cost: DndEquipment["cost"]): string {
  if (!cost || typeof cost.quantity !== "number" || !Number.isFinite(cost.quantity) || typeof cost.unit !== "string") {
    return "";
  }
  const u = cost.unit.trim();
  if (!u) return "";
  return `${cost.quantity} ${u}`;
}

/** PHB-style equipment reference (bundled catalog; no login). */
export default function EquipmentCompendiumPanel() {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<BrowseKind>("all");
  const [asc, setAsc] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = kind === "all" ? dndEquipment : dndEquipment.filter((e) => browseKind(e) === kind);
    let list = q ? base.filter((e) => e.name.toLowerCase().includes(q) || e.index.toLowerCase().includes(q)) : base;
    list = [...list].sort((a, b) => (asc ? 1 : -1) * a.name.localeCompare(b.name));
    return list;
  }, [search, kind, asc]);

  const selected = selectedIndex ? dndEquipment.find((e) => e.index === selectedIndex) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Equipment</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">PHB 2024 reference from bundled catalog.</p>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <span className={smallLabelClass()}>Search</span>
            <input
              className={inputClassFull()}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or slug…"
            />
          </label>
          <label className="flex min-w-[8rem] flex-col gap-1">
            <span className={smallLabelClass()}>Type</span>
            <select className={inputClassFull()} value={kind} onChange={(e) => setKind(e.target.value as BrowseKind)}>
              <option value="all">All</option>
              <option value="weapons">Weapons</option>
              <option value="armor_shields">Armor &amp; shields</option>
              <option value="gear">Other gear</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={smallLabelClass()}>Sort</span>
            <select className={inputClassFull()} value={asc ? "asc" : "desc"} onChange={(e) => setAsc(e.target.value === "asc")}>
              <option value="asc">Name A→Z</option>
              <option value="desc">Name Z→A</option>
            </select>
          </label>
        </div>

        <ul className="mt-3 max-h-[28rem] space-y-1 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          {rows.length === 0 ? (
            <li className="p-3 text-sm text-zinc-500">No matches.</li>
          ) : (
            rows.map((eq) => {
              const subtitle = summarizeRow(eq);
              return (
                <li key={eq.index}>
                  <button
                    type="button"
                    className={
                      "w-full rounded-none border-b border-zinc-100 px-2 py-1.5 text-left text-sm last:border-b-0 dark:border-zinc-800 " +
                      (selectedIndex === eq.index
                        ? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/60")
                    }
                    onClick={() => setSelectedIndex(eq.index)}
                  >
                    <span className="block truncate">{eq.name}</span>
                    {subtitle ? <span className="block truncate text-[11px] font-normal text-zinc-500">{subtitle}</span> : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Detail</h2>
        {!selected ? (
          <p className="mt-2 text-sm text-zinc-500">Pick an entry from the list.</p>
        ) : (
          <EquipmentDetailCard eq={selected} />
        )}
      </section>
    </div>
  );
}

function summarizeRow(eq: DndEquipment): string {
  const acBit = armorAcRulesText(eq);
  if (acBit) return `AC ${acBit}`;
  const ws = weaponSummaryOneLine(eq);
  if (ws) return ws;
  return secondaryCategoryLabel(eq);
}

/** Prefer a readable secondary category beyond generic "equipment". */
function secondaryCategoryLabel(eq: DndEquipment): string {
  const cats =
    eq.equipment_categories?.map((c) => c.name).filter((n) => n && n !== "Equipment" && n !== "Weapons" && n !== "Armor") ?? [];
  return cats.slice(0, 2).join(" · ") || "";
}

function weaponSummaryOneLine(eq: DndEquipment): string {
  const dmg = eq.damage;
  const d = dmg?.damage_dice;
  if (!d) return "";
  const t = dmg.damage_type?.name ?? "damage";
  const r = weaponIsVersatile(eq) && eq.two_handed_damage?.damage_dice ? ` / ${eq.two_handed_damage.damage_dice}` : "";
  return `${d}${r} ${t}`;
}

function EquipmentDetailCard(props: { eq: DndEquipment }) {
  const e = props.eq;
  const costText = formatCost(e.cost);
  const categories = e.equipment_categories?.map((c) => c.name).filter(Boolean) ?? [];
  const acBit = armorAcRulesText(e);
  const desc = stripMarkdownBoldMarkers(e.description ?? "").trim();

  return (
    <div className="mt-3 space-y-4 text-sm text-zinc-700 dark:text-zinc-200">
      <div>
        <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-50">{e.name}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{e.index}</p>
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((n) => (
            <span
              key={n}
              className="rounded-full border border-zinc-200 bg-white/70 px-2 py-0.5 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/30 dark:text-zinc-400"
            >
              {n}
            </span>
          ))}
        </div>
      ) : null}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <dt className="text-xs text-zinc-500">Cost</dt>
          <dd className="font-medium">{costText || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Weight</dt>
          <dd className="font-medium tabular-nums">
            {e.weight != null && Number.isFinite(e.weight) ? `${e.weight} lb.` : "—"}
          </dd>
        </div>
      </dl>

      {weaponBlock(e)}
      {acBit ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Armor class</h4>
          <p className="mt-1 text-sm">{acBit}</p>
        </div>
      ) : null}

      {desc ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Description</h4>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{desc}</p>
        </div>
      ) : null}
    </div>
  );
}

function weaponBlock(e: DndEquipment) {
  const d = e.damage?.damage_dice;
  if (!isWeapon(e) || !d) return null;
  const t = e.damage?.damage_type?.name ?? "damage";
  const rangeParts: string[] = [];
  if (e.range?.normal != null) rangeParts.push(`${e.range.normal} ft.`);
  if (e.range?.long != null) rangeParts.push(`long ${e.range.long} ft.`);
  const props = e.properties?.map((p) => p.name).filter(Boolean) ?? [];
  return (
    <div className="space-y-2">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Damage</h4>
        <p className="mt-1 text-sm">
          {d} {t}
          {e.two_handed_damage?.damage_dice ? (
            <span className="text-zinc-500">
              {" "}
              (two-handed {e.two_handed_damage.damage_dice})
            </span>
          ) : null}
        </p>
      </div>
      {rangeParts.length > 0 ? (
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Range </span>
          <span className="text-sm">{rangeParts.join(" · ")}</span>
        </div>
      ) : null}
      {props.length > 0 ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Properties</h4>
          <p className="mt-1 text-sm">{props.join(", ")}</p>
        </div>
      ) : null}
      {e.mastery?.name ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Mastery</h4>
          <p className="mt-1 text-sm">{e.mastery.name}</p>
        </div>
      ) : null}
    </div>
  );
}
