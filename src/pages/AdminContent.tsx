import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import AdminFeatsCrud from "@/components/features/admin/AdminFeatsCrud";
import AdminFeaturesCrud from "@/components/features/admin/AdminFeaturesCrud";
import AdminSpellsCrud from "@/components/features/admin/AdminSpellsCrud";
import { highlightButtonClass } from "@/components/ui/controlClasses";
import { useProfile } from "@/lib/auth";
import { listRulesets, type Ruleset } from "@/lib/db/rulesets";

type ContentTab = "feats" | "features" | "spells";

/**
 * Admin-only catalog editor for ruleset tables (feats, features, spells).
 */
export default function AdminContent() {
  const { profile, loading: profileLoading } = useProfile();
  const [tab, setTab] = useState<ContentTab>("feats");
  const [rulesets, setRulesets] = useState<Ruleset[]>([]);
  const [rulesetsError, setRulesetsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const rs = await listRulesets();
        if (!cancelled) {
          setRulesets(rs);
          setRulesetsError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setRulesetsError(e instanceof Error ? e.message : "Failed to load rulesets");
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (profileLoading) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white/70 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
        Loading…
      </section>
    );
  }

  if (!profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h1 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-50">Admin · Content</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        Full read/write on catalog rows. Inserts must use a valid ruleset and unique (ruleset, slug).
      </p>
      {rulesetsError ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          {rulesetsError}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        {(
          [
            ["feats", "Feats"],
            ["features", "Features"],
            ["spells", "Spells"]
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={highlightButtonClass(tab === id)}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "feats" ? <AdminFeatsCrud rulesets={rulesets} /> : null}
        {tab === "features" ? <AdminFeaturesCrud rulesets={rulesets} /> : null}
        {tab === "spells" ? <AdminSpellsCrud rulesets={rulesets} /> : null}
      </div>
    </section>
  );
}
