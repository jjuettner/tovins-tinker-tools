/**
 * Theme-aware Tailwind bundles for condition pills (light + dark).
 * One stable color per canonical SRD slug; unknown slugs use a deterministic fallback palette.
 */
const BY_SLUG: Record<string, string> = {
  blinded:
    "border border-slate-400 bg-slate-200 text-slate-950 hover:bg-slate-300 dark:border-slate-500 dark:bg-slate-800/85 dark:text-slate-50 dark:hover:bg-slate-700/95",
  charmed:
    "border border-fuchsia-400 bg-fuchsia-100 text-fuchsia-950 hover:bg-fuchsia-200/90 dark:border-fuchsia-600 dark:bg-fuchsia-950/50 dark:text-fuchsia-100 dark:hover:bg-fuchsia-900/65",
  deafened:
    "border border-violet-400 bg-violet-100 text-violet-950 hover:bg-violet-200/90 dark:border-violet-600 dark:bg-violet-950/55 dark:text-violet-100 dark:hover:bg-violet-900/70",
  exhaustion:
    "border border-amber-500 bg-amber-100 text-amber-950 hover:bg-amber-200 dark:border-amber-600 dark:bg-amber-950/55 dark:text-amber-50 dark:hover:bg-amber-900/70",
  frightened:
    "border border-orange-400 bg-orange-100 text-orange-950 hover:bg-orange-200 dark:border-orange-600 dark:bg-orange-950/55 dark:text-orange-100 dark:hover:bg-orange-900/70",
  grappled:
    "border border-rose-400 bg-rose-100 text-rose-950 hover:bg-rose-200 dark:border-rose-600 dark:bg-rose-950/50 dark:text-rose-100 dark:hover:bg-rose-900/65",
  incapacitated:
    "border border-zinc-400 bg-zinc-200 text-zinc-950 hover:bg-zinc-300 dark:border-zinc-500 dark:bg-zinc-800/90 dark:text-zinc-50 dark:hover:bg-zinc-700",
  invisible:
    "border border-cyan-400 bg-cyan-100 text-cyan-950 hover:bg-cyan-200 dark:border-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-100 dark:hover:bg-cyan-900/70",
  paralyzed:
    "border border-sky-500 bg-sky-100 text-sky-950 hover:bg-sky-200 dark:border-sky-600 dark:bg-sky-950/55 dark:text-sky-100 dark:hover:bg-sky-900/70",
  petrified:
    "border border-stone-500 bg-stone-200 text-stone-950 hover:bg-stone-300 dark:border-stone-500 dark:bg-stone-800/85 dark:text-stone-100 dark:hover:bg-stone-700/90",
  poisoned:
    "border border-emerald-500 bg-emerald-100 text-emerald-950 hover:bg-emerald-200 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-100 dark:hover:bg-emerald-900/70",
  prone:
    "border border-lime-500 bg-lime-100 text-lime-950 hover:bg-lime-200 dark:border-lime-600 dark:bg-lime-950/45 dark:text-lime-100 dark:hover:bg-lime-900/60",
  restrained:
    "border border-indigo-500 bg-indigo-100 text-indigo-950 hover:bg-indigo-200 dark:border-indigo-600 dark:bg-indigo-950/55 dark:text-indigo-100 dark:hover:bg-indigo-900/70",
  stunned:
    "border border-yellow-500 bg-yellow-100 text-yellow-950 hover:bg-yellow-200 dark:border-yellow-600 dark:bg-yellow-950/45 dark:text-yellow-50 dark:hover:bg-yellow-900/55",
  unconscious:
    "border border-purple-500 bg-purple-100 text-purple-950 hover:bg-purple-200 dark:border-purple-600 dark:bg-purple-950/55 dark:text-purple-100 dark:hover:bg-purple-900/70"
};

const FALLBACK = [
  "border border-teal-500 bg-teal-100 text-teal-950 hover:bg-teal-200 dark:border-teal-600 dark:bg-teal-950/50 dark:text-teal-100 dark:hover:bg-teal-900/70",
  "border border-pink-500 bg-pink-100 text-pink-950 hover:bg-pink-200 dark:border-pink-600 dark:bg-pink-950/50 dark:text-pink-100 dark:hover:bg-pink-900/70",
  "border border-red-400 bg-red-100 text-red-950 hover:bg-red-200 dark:border-red-600 dark:bg-red-950/50 dark:text-red-100 dark:hover:bg-red-900/70",
  "border border-blue-500 bg-blue-100 text-blue-950 hover:bg-blue-200 dark:border-blue-600 dark:bg-blue-950/55 dark:text-blue-100 dark:hover:bg-blue-900/70",
  "border border-green-600 bg-green-100 text-green-950 hover:bg-green-200 dark:border-green-600 dark:bg-green-950/50 dark:text-green-100 dark:hover:bg-green-900/70"
] as const;

/**
 * CSS class string for a condition pill (border, background, text, hover) in light and dark mode.
 *
 * @param slug Condition slug (case-insensitive).
 * @returns Tailwind utility string.
 */
export function conditionPillClassForSlug(slug: string): string {
  const key = slug.trim().toLowerCase();
  const known = BY_SLUG[key];
  if (known) return known;
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return FALLBACK[h % FALLBACK.length];
}
