import { StorageCard } from "./components/StorageCard";

export default function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">vibe</h1>
        <p className="text-sm text-zinc-300">
          Vite + React + TS. Tailwind. Storage helper + hook + component.
        </p>
      </header>

      <StorageCard />
    </main>
  );
}
