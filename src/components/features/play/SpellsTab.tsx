import { useState } from "react";
import { buttonClass } from "@/components/ui/controlClasses";
import { computeSpellSlotsRemaining, type spellSlotMaximaForClass } from "@/lib/spellSlots";
import type { Character } from "@/types/character";
import type { DndSpell } from "@/lib/dndData";

function spellParagraphs(lines: string[] | undefined): string {
  return (lines ?? []).map((p) => p.trim()).filter(Boolean).join("\n\n");
}

function SpellPlayCard({ spell }: { spell: DndSpell }) {
  const desc = spellParagraphs(spell.desc);
  const hi = spellParagraphs(spell.higher_level);
  return (
    <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50/90 p-3 text-left text-xs dark:border-zinc-700 dark:bg-zinc-950/50">
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        {spell.school?.name ? <span>{spell.school.name}</span> : null}
        {spell.casting_time ? <span>· {spell.casting_time}</span> : null}
        {spell.range ? <span>· {spell.range}</span> : null}
        {spell.duration ? <span>· {spell.duration}</span> : null}
        {spell.concentration ? <span>· Concentration</span> : null}
        {spell.ritual ? <span>· Ritual</span> : null}
      </div>
      {desc ? <p className="mt-2 whitespace-pre-wrap leading-relaxed text-zinc-700 dark:text-zinc-200">{desc}</p> : null}
      {hi ? (
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">At higher levels. </span>
          {hi}
        </p>
      ) : null}
    </div>
  );
}

function CastSpellModal(props: {
  c: Character;
  spell: { index: string; name: string; level: number };
  maxima: ReturnType<typeof spellSlotMaximaForClass>;
  onClose(): void;
  onConfirm(slotLevel: number): void;
}) {
  const rows = computeSpellSlotsRemaining(props.maxima, props.c.spellSlotsUsed);
  const options = rows.filter((r) => r.spellLevel >= props.spell.level && r.remaining > 0);
  const [pick, setPick] = useState(options[0]?.spellLevel ?? props.spell.level);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">Cast {props.spell.name}</h2>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Spell level {props.spell.level}. Pick slot level to expend (upcasting).</p>
        {options.length === 0 ? (
          <p className="mt-3 text-sm text-red-600">No valid slots.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {options.map((o) => (
              <label key={o.spellLevel} className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                <input type="radio" name="slot" checked={pick === o.spellLevel} onChange={() => setPick(o.spellLevel)} />
                Level {o.spellLevel} ({o.remaining} left)
              </label>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={buttonClass("ghost")} onClick={props.onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={buttonClass("primary")}
            disabled={options.length === 0}
            onClick={() => props.onConfirm(pick)}
          >
            Use slot
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SpellsTab(props: {
  c: Character;
  maxima: ReturnType<typeof spellSlotMaximaForClass>;
  slotRows: ReturnType<typeof computeSpellSlotsRemaining>;
  prepared: DndSpell[];
  cantrips: DndSpell[];
  onPatch(next: Character): void;
}) {
  const [castSpell, setCastSpell] = useState<{ index: string; name: string; level: number } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Spell slots</h2>
        {props.slotRows.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">No spell slots for this class / level.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {props.slotRows.map((r) => (
              <li key={r.spellLevel} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Level {r.spellLevel}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {Array.from({ length: r.max }).map((_, i) => {
                    const filled = i < r.remaining;
                    return (
                      <span
                        key={i}
                        className={
                          "inline-flex h-4 w-4 items-center justify-center text-[12px] leading-none " +
                          (filled ? "text-sky-600 dark:text-sky-300" : "text-zinc-300 dark:text-zinc-700")
                        }
                        aria-label={filled ? "slot available" : "slot used"}
                        title={filled ? "available" : "used"}
                      >
                        {filled ? "🔥" : "△"}
                      </span>
                    );
                  })}
                </div>
                <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
                  {r.remaining}/{r.max}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {props.cantrips.length > 0 ? (
        <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Cantrips</h2>
          <ul className="mt-3 space-y-2">
            {props.cantrips.map((s) => (
              <li key={s.index} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex gap-2 p-2">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="w-full rounded-md px-2 py-1.5 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800/60"
                      onClick={() => setExpandedId((id) => (id === s.index ? null : s.index))}
                    >
                      {s.name}
                      <span className="ml-2 text-xs font-normal text-zinc-500">Cantrip</span>
                    </button>
                    {expandedId === s.index ? <SpellPlayCard spell={s} /> : null}
                  </div>
                  <div className="flex w-[5.5rem] shrink-0 items-start justify-end pt-1">
                    <span className="text-[11px] text-zinc-400">—</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Prepared spells</h2>
        {props.prepared.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">No leveled prepared spells.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {props.prepared.map((s) => {
              const rows = props.slotRows.filter((r) => r.spellLevel >= s.level && r.remaining > 0);
              const disabled = rows.length === 0;
              return (
                <li key={s.index} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="flex gap-2 p-2">
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        className="w-full rounded-md px-2 py-1.5 text-left text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800/60"
                        onClick={() => setExpandedId((id) => (id === s.index ? null : s.index))}
                      >
                        {s.name}
                        <span className="ml-2 text-xs font-normal text-zinc-500">Lv {s.level}+</span>
                      </button>
                      {expandedId === s.index ? <SpellPlayCard spell={s} /> : null}
                    </div>
                    <div className="flex w-[5.5rem] shrink-0 items-start justify-end">
                      <button
                        type="button"
                        disabled={disabled}
                        className={buttonClass("primary") + " min-h-[2.25rem] px-3 py-1.5 text-xs " + (disabled ? "opacity-50" : "")}
                        onClick={() => setCastSpell({ index: s.index, name: s.name, level: s.level })}
                      >
                        Cast
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {castSpell ? (
        <CastSpellModal
          key={castSpell.index}
          c={props.c}
          spell={castSpell}
          maxima={props.maxima}
          onClose={() => setCastSpell(null)}
          onConfirm={(slotLevel) => {
            const key = String(slotLevel);
            const used = { ...props.c.spellSlotsUsed };
            used[key] = (used[key] ?? 0) + 1;
            props.onPatch({ ...props.c, spellSlotsUsed: used });
            setCastSpell(null);
          }}
        />
      ) : null}
    </div>
  );
}

