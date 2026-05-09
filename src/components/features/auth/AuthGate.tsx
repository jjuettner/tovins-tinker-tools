import type { ReactNode } from "react";
import { useBootstrapCatalog } from "@/hooks/useBootstrapCatalog";
import { useSession } from "@/lib/auth";
import { SignIn } from "@/components/features/auth/SignIn";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  // best-effort preload; UI still works with bundled JSON fallbacks
  useBootstrapCatalog();

  if (loading) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white/70 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
        Loading…
      </section>
    );
  }

  if (!session) return <SignIn />;

  return <>{children}</>;
}

