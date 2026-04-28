export function AboutRoute() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200 bg-white/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          About
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Simple starter: layout, routing, theme toggle, and a storage demo.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            Vite + React 19
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            Tailwind
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
            React Router
          </span>
        </div>
      </section>
    </div>
  );
}

