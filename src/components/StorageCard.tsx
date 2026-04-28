import { useStoredState } from "../hooks/useStoredState";

type Profile = {
  name: string;
};

const storageKey = "vibe.profile";

export function StorageCard() {
  const {
    value: profile,
    setValue: setProfile,
    reset
  } = useStoredState<Profile>(storageKey, {
    name: "Jens"
  });

  return (
    <section className="rounded-xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-50">Stored profile</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            This name persists via <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800/60">localStorage</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-zinc-200 bg-white/60 px-3 py-1.5 text-sm text-zinc-900 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          Reset
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <label className="text-sm text-zinc-600 dark:text-zinc-300" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          value={profile.name}
          onChange={(e) => setProfile({ name: e.target.value })}
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500"
        />
      </div>
    </section>
  );
}
