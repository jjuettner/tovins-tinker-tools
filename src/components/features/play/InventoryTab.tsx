import { Coins, Wallet } from "lucide-react";
import { useState } from "react";
import { buttonClass, inputClassFull, smallLabelClass } from "@/components/ui/controlClasses";
import { addCurrency, subtractCurrency } from "@/lib/character/currency";
import { CURRENCY_DENOMINATIONS } from "@/lib/character/currencyDisplay";
import type { Character, CurrencyPouch } from "@/types/character";

function parseNonNegInt(s: string): number {
  const n = Math.floor(Number(s) || 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function pouchFromForm(parts: Record<keyof CurrencyPouch, string>): CurrencyPouch {
  return {
    pp: parseNonNegInt(parts.pp),
    gp: parseNonNegInt(parts.gp),
    ep: parseNonNegInt(parts.ep),
    sp: parseNonNegInt(parts.sp),
    cp: parseNonNegInt(parts.cp)
  };
}

const EMPTY_FORM: Record<keyof CurrencyPouch, string> = { pp: "", gp: "", ep: "", sp: "", cp: "" };

export default function InventoryTab(props: { c: Character; onPatch(next: Character): void }) {
  const [form, setForm] = useState<Record<keyof CurrencyPouch, string>>({ ...EMPTY_FORM });
  const [error, setError] = useState<string | null>(null);

  function applyAdd() {
    setError(null);
    const delta = pouchFromForm(form);
    const nextPouch = addCurrency(props.c.currency, delta);
    props.onPatch({ ...props.c, currency: nextPouch });
    setForm({ ...EMPTY_FORM });
  }

  function applyRemove() {
    setError(null);
    const amount = pouchFromForm(form);
    const r = subtractCurrency(props.c.currency, amount);
    if (!r.ok) {
      setError(`Not enough coin (short by ${r.shortByCp} cp value).`);
      return;
    }
    props.onPatch({ ...props.c, currency: r.pouch });
    setForm({ ...EMPTY_FORM });
  }

  const pouch = props.c.currency;

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex flex-wrap items-center gap-2">
          <Wallet className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Pouch</h2>
          <Coins className="h-4 w-4 text-zinc-500 opacity-80" aria-hidden="true" />
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Adding never carries up. Spending makes change down to CP.
        </p>

        <ul className="mt-4 flex flex-wrap gap-3">
          {CURRENCY_DENOMINATIONS.map((d) => (
            <li
              key={d.key}
              className={
                "flex min-w-[8.5rem] items-center gap-2 rounded-lg border border-zinc-200 bg-white/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/30"
              }
            >
              <span
                className={
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold " + d.chip
                }
                title={d.full}
                aria-hidden="true"
              >
                {d.abbrev}
              </span>
              <div className="min-w-0">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{d.full}</div>
                <div className="tabular-nums text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {pouch[d.key]}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          Exchange: 1 pp = 10 gp · 1 gp = 10 sp · 1 sp = 10 cp · 1 ep = 5 sp · 1 gp = 100 cp
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Add / spend</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Add coin or spend coin with the same amounts below. Spend checks against your whole pouch (any mix of coins).
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CURRENCY_DENOMINATIONS.map((d) => (
            <label key={d.key} className="flex flex-col gap-1">
              <span className={smallLabelClass()}>
                {d.abbrev} <span className="font-normal opacity-80">({d.full})</span>
              </span>
              <input
                type="number"
                min={0}
                className={inputClassFull()}
                value={form[d.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [d.key]: e.target.value }))}
                placeholder="0"
              />
            </label>
          ))}
        </div>
        {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={buttonClass("primary")} onClick={applyAdd}>
            Add
          </button>
          <button type="button" className={buttonClass("danger")} onClick={applyRemove}>
            Remove
          </button>
          <button type="button" className={buttonClass("ghost")} onClick={() => setForm({ ...EMPTY_FORM })}>
            Clear inputs
          </button>
        </div>
      </section>
    </div>
  );
}
