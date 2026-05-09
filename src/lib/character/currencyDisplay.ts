import type { CurrencyPouch } from "@/types/character";

export type DenominationDisplay = {
  key: keyof CurrencyPouch;
  abbrev: string;
  full: string;
  chip: string;
};

/** Order high → low value; styling for coin “icons” (letter badges). */
export const CURRENCY_DENOMINATIONS: readonly DenominationDisplay[] = [
  { key: "pp", abbrev: "PP", full: "Platinum", chip: "bg-violet-600/90 text-violet-50 ring-1 ring-violet-400/50" },
  { key: "gp", abbrev: "GP", full: "Gold", chip: "bg-amber-500/90 text-amber-950 ring-1 ring-amber-300/50" },
  { key: "ep", abbrev: "EP", full: "Electrum", chip: "bg-teal-600/90 text-teal-50 ring-1 ring-teal-400/50" },
  { key: "sp", abbrev: "SP", full: "Silver", chip: "bg-slate-500/90 text-slate-50 ring-1 ring-slate-400/50" },
  { key: "cp", abbrev: "CP", full: "Copper", chip: "bg-orange-700/90 text-orange-50 ring-1 ring-orange-500/50" }
];
