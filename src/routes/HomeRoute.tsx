import { ArrowRight, Database } from "lucide-react";
import { Link } from "react-router-dom";

function Card(props: {
  title: string;
  body: string;
  to: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={props.to}
      className="group rounded-xl border border-zinc-200 bg-white/70 p-4 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
            {props.icon}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{props.title}</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-300">{props.body}</span>
          </div>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-200" />
      </div>
    </Link>
  );
}

export function HomeRoute() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-white/80 to-white/50 p-6 dark:border-zinc-800 dark:from-zinc-900/60 dark:to-zinc-900/20">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Home
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
          Global layout with menu + routes. Dark mode persists in <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800/60">localStorage</code>.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card
          title="Storage demo"
          body="Persist typed state via hook"
          to="/storage"
          icon={<Database className="h-4 w-4" aria-hidden="true" />}
        />
        <Card
          title="About"
          body="Placeholder route"
          to="/about"
          icon={<span className="text-sm font-semibold">i</span>}
        />
      </section>
    </div>
  );
}

