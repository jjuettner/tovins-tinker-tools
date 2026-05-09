import type { CurrencyPouch } from "@/types/character";

export type { CurrencyPouch };

/** 1 gp in copper-equivalent units (10 sp × 10 cp/sp). */
const GP_AS_CP = 100;
/** 1 ep in copper (5 sp × 10 cp/sp). */
const EP_AS_CP = 50;

/**
 * Canonical empty pouch (use spread to copy).
 *
 * Exchange rates baked into totals: pp=10 gp, gp=10 sp, sp=10 cp, ep=5 sp (50 cp), gp=100 cp.
 */
export const EMPTY_CURRENCY_POUCH: CurrencyPouch = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };

/** Total value in fractional copper-equivalent coins (still integer arithmetic). */
export function pouchTotalCp(p: CurrencyPouch): number {
  const clamped = sanitizeParts(p);
  return (
    clamped.cp +
    clamped.sp * 10 +
    clamped.ep * EP_AS_CP +
    clamped.gp * GP_AS_CP +
    clamped.pp * GP_AS_CP * 10
  );
}

/** Floor each part to non-negative integers. */
export function sanitizeParts(raw: Partial<Record<keyof CurrencyPouch, unknown>>): CurrencyPouch {
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);
  return {
    pp: n(raw.pp),
    gp: n(raw.gp),
    ep: n(raw.ep),
    sp: n(raw.sp),
    cp: n(raw.cp)
  };
}

/**
 * Parse unknown JSON from older saves into a normalized pouch.
 *
 * @param raw `character.currency` blob.
 */
export function parseCurrencyPouch(raw: unknown): CurrencyPouch {
  if (!raw || typeof raw !== "object") return { ...EMPTY_CURRENCY_POUCH };
  const o = raw as Record<string, unknown>;
  return sanitizeParts({
    pp: o.pp,
    gp: o.gp,
    ep: o.ep,
    sp: o.sp,
    cp: o.cp
  });
}

/**
 * Add coin without carrying upwards.
 *
 * @param base Current pouch.
 * @param delta Coins to add (each part ≥ 0).
 */
export function addCurrency(base: CurrencyPouch, delta: CurrencyPouch): CurrencyPouch {
  const a = sanitizeParts(base);
  const b = sanitizeParts(delta);
  return {
    pp: a.pp + b.pp,
    gp: a.gp + b.gp,
    ep: a.ep + b.ep,
    sp: a.sp + b.sp,
    cp: a.cp + b.cp
  };
}

export type SubtractCurrencyResult =
  | { ok: true; pouch: CurrencyPouch }
  | { ok: false; error: "insufficient"; shortByCp: number };

/**
 * Subtract `amount` from `base`; fails if holdings are too low.
 *
 * @param base Current pouch.
 * @param amount Coins to spend (each part ≥ 0).
 */
export function subtractCurrency(base: CurrencyPouch, amount: CurrencyPouch): SubtractCurrencyResult {
  const total = pouchTotalCp(base);
  const need = pouchTotalCp(amount);
  if (need <= 0) return { ok: true, pouch: sanitizeParts(base) };
  if (need > total) return { ok: false, error: "insufficient", shortByCp: need - total };
  // Spending makes change downwards (no upwards consolidation).
  return { ok: true, pouch: { ...EMPTY_CURRENCY_POUCH, cp: total - need } };
}
