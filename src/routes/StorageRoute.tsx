import { StorageCard } from "../components/StorageCard";

export function StorageRoute() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Storage
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          `useStoredState` + `readStorage`/`writeStorage` using <span className="font-medium">localStorage</span>.
        </p>
      </header>

      <StorageCard />
    </div>
  );
}

