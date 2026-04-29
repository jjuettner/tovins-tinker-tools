export function buttonClass(variant: "primary" | "ghost" | "danger" = "ghost") {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";
  if (variant === "primary") {
    return `${base} border-zinc-200 bg-zinc-900 text-white hover:bg-zinc-800 dark:border-zinc-700 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-white`;
  }
  if (variant === "danger") {
    return `${base} border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/40`;
  }
  return `${base} border-zinc-200 bg-white/60 text-zinc-900 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-50 dark:hover:bg-zinc-900`;
}

export function inputClass() {
  return "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500";
}

export function smallLabelClass() {
  return "text-xs font-medium text-zinc-600 dark:text-zinc-300";
}

