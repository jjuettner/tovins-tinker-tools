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
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">Stored profile</h2>
          <p className="text-sm text-zinc-300">This name persists via `localStorage`.</p>
        </div>

        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800"
        >
          Reset
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <label className="text-sm text-zinc-300" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          value={profile.name}
          onChange={(e) => setProfile({ name: e.target.value })}
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
      </div>
    </section>
  );
}
