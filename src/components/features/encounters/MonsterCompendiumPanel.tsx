import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { buttonClass, inputClassFull, smallLabelClass } from "@/components/ui/controlClasses";
import { listMonsters, type MonsterRow, type MonsterSort } from "@/lib/db/monsters";

type Props = {
  /** When set, show an Add button on each row / detail to pick monsters for an encounter. */
  onPickMonster?: (m: MonsterRow) => void;
  pickLabel?: string;
};

export default function MonsterCompendiumPanel(props: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<MonsterSort>("name");
  const [asc, setAsc] = useState(true);
  const [rows, setRows] = useState<MonsterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MonsterRow | null>(null);
  const [imageOverlayUrl, setImageOverlayUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await listMonsters({ search: search.trim() || undefined, sort, asc });
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load monsters");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [search, sort, asc]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Monster compendium</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Search and sort. Requires seeded `monsters` table.</p>

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <span className={smallLabelClass()}>Search name</span>
            <input className={inputClassFull()} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. dragon" />
          </label>
          <label className="flex flex-col gap-1">
            <span className={smallLabelClass()}>Sort</span>
            <select className={inputClassFull()} value={sort} onChange={(e) => setSort(e.target.value as MonsterSort)}>
              <option value="name">Name</option>
              <option value="cr">Challenge</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={smallLabelClass()}>Order</span>
            <select className={inputClassFull()} value={asc ? "asc" : "desc"} onChange={(e) => setAsc(e.target.value === "asc")}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="mt-3 text-sm text-zinc-500">Loading…</p> : null}

        {!loading && !error ? (
          <ul className="mt-3 max-h-[28rem] space-y-1 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            {rows.length === 0 ? (
              <li className="p-3 text-sm text-zinc-500">No matches.</li>
            ) : (
              rows.map((m) => (
                <li key={m.id}>
                  <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 p-2 last:border-b-0 dark:border-zinc-800">
                    <button
                      type="button"
                      className={
                        "min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-sm font-medium " +
                        (selected?.id === m.id
                          ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                          : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/60")
                      }
                      onClick={() => setSelected(m)}
                    >
                      <span className="truncate">{m.name}</span>
                      <span className="ml-2 tabular-nums text-xs font-normal text-zinc-500">CR {m.cr}</span>
                    </button>
                    {props.onPickMonster ? (
                      <button type="button" className={buttonClass("primary") + " shrink-0 text-xs"} onClick={() => props.onPickMonster?.(m)}>
                        {props.pickLabel ?? "Add"}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Detail</h2>
          {selected && props.onPickMonster ? (
            <button
              type="button"
              className={buttonClass("primary") + " h-8 px-2 py-0 text-xs"}
              onClick={() => props.onPickMonster?.(selected)}
            >
              {props.pickLabel ?? "Add"}
            </button>
          ) : null}
        </div>
        {!selected ? (
          <p className="mt-2 text-sm text-zinc-500">Select a monster from the list.</p>
        ) : (
          <MonsterDetailCard
            monster={selected}
            onPick={props.onPickMonster}
            pickLabel={props.pickLabel}
            onOpenImage={(url) => setImageOverlayUrl(url)}
          />
        )}
      </section>

      {imageOverlayUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => setImageOverlayUrl(null)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={buttonClass("ghost") + " absolute right-2 top-2"}
              onClick={() => setImageOverlayUrl(null)}
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <img src={imageOverlayUrl} alt="" className="max-h-[80dvh] w-full object-contain" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MonsterDetailCard(props: {
  monster: MonsterRow;
  onPick?: (m: MonsterRow) => void;
  pickLabel?: string;
  onOpenImage?: (url: string) => void;
}) {
  const m = props.monster;
  const abilityRows = [
    { abbr: "STR", score: m.str, mod: m.str_mod },
    { abbr: "DEX", score: m.dex, mod: m.dex_mod },
    { abbr: "CON", score: m.con, mod: m.con_mod },
    { abbr: "INT", score: m.int, mod: m.int_mod },
    { abbr: "WIS", score: m.wis, mod: m.wis_mod },
    { abbr: "CHA", score: m.cha, mod: m.cha_mod }
  ] as const;

  const skills = parseSkillBonuses(m.skills);
  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {m.img_url ? (
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 sm:w-48">
            <div className="aspect-[4/3] bg-zinc-50 dark:bg-zinc-950/20">
              <button type="button" className="block h-full w-full" onClick={() => props.onOpenImage?.(m.img_url ?? "")}>
                <img src={m.img_url} alt="" className="h-full w-full object-cover object-top" />
              </button>
            </div>
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-50">{m.name}</h3>
          {m.meta ? <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.meta}</p> : null}
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-zinc-700 dark:text-zinc-200">
            <div>
              <dt className="text-xs text-zinc-500">AC</dt>
              <dd className="font-medium">{m.ac ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">HP</dt>
              <dd className="font-medium">
                {m.hp}
                {m.hp_dice ? <span className="text-zinc-500"> ({m.hp_dice})</span> : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">CR</dt>
              <dd className="font-medium tabular-nums">{m.cr}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">XP</dt>
              <dd className="font-medium tabular-nums">{m.xp}</dd>
            </div>
          </dl>
          {abilityRows.some((r) => r.score !== null || r.mod !== null) ? (
            <div className="mt-3 grid grid-cols-6 gap-2">
              {abilityRows.map((r) => (
                <div key={r.abbr} className="rounded-lg border border-zinc-200 px-2 py-1 text-center dark:border-zinc-800">
                  <div className="text-[11px] font-semibold text-zinc-500">{r.abbr}</div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{r.score ?? "—"}</div>
                  <div className="text-xs text-zinc-500">{r.mod === null ? "" : r.mod >= 0 ? `+${r.mod}` : `${r.mod}`}</div>
                </div>
              ))}
            </div>
          ) : null}
          {skills.length > 0 ? (
            <div className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Skills</div>
              <ul className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                {skills.map((s) => (
                  <li key={s.name} className="rounded-full border border-zinc-200 bg-white/70 px-2 py-0.5 text-xs dark:border-zinc-800 dark:bg-zinc-950/20">
                    {s.name} {s.bonus >= 0 ? `+${s.bonus}` : s.bonus}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {m.saving_throws ? (
            <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="font-semibold">Saves:</span> {m.saving_throws}
            </div>
          ) : null}
        </div>
      </div>

      {m.traits_html ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Traits</h4>
          <div
            className="monster-html mt-1 space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [&_p]:my-1"
            dangerouslySetInnerHTML={{ __html: m.traits_html }}
          />
        </div>
      ) : null}
      {m.actions_html ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Actions</h4>
          <div
            className="monster-html mt-1 space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [&_p]:my-1"
            dangerouslySetInnerHTML={{ __html: m.actions_html }}
          />
        </div>
      ) : null}
      {m.legendary_html ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Legendary</h4>
          <div
            className="monster-html mt-1 space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [&_p]:my-1"
            dangerouslySetInnerHTML={{ __html: m.legendary_html }}
          />
        </div>
      ) : null}
    </div>
  );
}

function parseSkillBonuses(raw: string | null): { name: string; bonus: number }[] {
  const s = (raw ?? "").trim();
  if (!s) return [];
  return s
    .split(",")
    .map((part) => part.trim())
    .map((part) => {
      const m = part.match(/^(.+?)\s+([+-]\d+)\s*$/);
      if (!m) return null;
      const name = m[1].trim();
      const bonus = Number.parseInt(m[2], 10);
      if (!name || !Number.isFinite(bonus)) return null;
      return { name, bonus };
    })
    .filter((x): x is { name: string; bonus: number } => Boolean(x));
}
