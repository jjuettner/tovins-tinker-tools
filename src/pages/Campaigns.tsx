import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buttonClass, inputClassFull, smallLabelClass } from "@/components/ui/controlClasses";
import { useSession } from "@/lib/auth";
import { createCampaignInvite } from "@/lib/db/campaignInvites";
import {
  attachCampaignRuleset,
  createCampaign,
  detachCampaignRuleset,
  listCampaignRulesets,
  listCampaigns
} from "@/lib/db/campaigns";
import { listRulesets } from "@/lib/db/rulesets";

type UiCampaign = {
  id: string;
  name: string;
  description: string | null;
  rulesetIds: string[];
};

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<UiCampaign[]>([]);
  const [rulesets, setRulesets] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session, loading: sessionLoading } = useSession();
  const [inviteByCampaignId, setInviteByCampaignId] = useState<Record<string, string>>({});

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [cs, rs] = await Promise.all([listCampaigns(), listRulesets()]);
      const byId = new Map<string, UiCampaign>();
      cs.forEach((c) => byId.set(c.id, { id: c.id, name: c.name, description: c.description, rulesetIds: [] }));
      const rulesetIdsByCampaign = await Promise.all(cs.map((c) => listCampaignRulesets(c.id)));
      cs.forEach((c, i) => {
        const ui = byId.get(c.id);
        if (ui) ui.rulesetIds = rulesetIdsByCampaign[i] ?? [];
      });
      setCampaigns(Array.from(byId.values()));
      setRulesets(rs.map((r) => ({ id: r.id, name: r.name })));
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load campaigns");
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onCreate() {
    if (sessionLoading) return;
    if (!session?.user?.id) {
      setError("Sign in to create a campaign.");
      return;
    }
    const name = newName.trim();
    if (!name) return;
    setError(null);
    try {
      await createCampaign({ name, description: newDesc.trim() || null });
      setNewName("");
      setNewDesc("");
      await refresh();
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
        return;
      }
      if (typeof e === "object" && e !== null && "message" in e) {
        const msg = typeof e.message === "string" ? e.message : "Failed to create campaign";
        const code = "code" in e && typeof e.code === "string" ? e.code : null;
        setError(code ? `${msg} (${code})` : msg);
        return;
      }
      setError("Failed to create campaign");
    }
  }

  const rulesetName = useMemo(() => new Map(rulesets.map((r) => [r.id, r.name] as const)), [rulesets]);
  const baseUrl = useMemo(() => window.location.origin + import.meta.env.BASE_URL, []);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Campaigns</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Attach multiple rulesets. Pick entries by ruleset (namespaced).</p>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className={smallLabelClass()}>Name</span>
            <input className={inputClassFull()} value={newName} onChange={(e) => setNewName(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className={smallLabelClass()}>Description</span>
            <input className={inputClassFull()} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          </label>
        </div>
        <div className="mt-3">
          <button
            type="button"
            className={buttonClass("primary")}
            onClick={() => void onCreate()}
            disabled={!session?.user?.id || sessionLoading}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create campaign
          </button>
          {!sessionLoading && !session?.user?.id ? (
            <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">Sign in required.</div>
          ) : null}
        </div>
      </section>

      {loading ? <div className="text-sm text-zinc-600 dark:text-zinc-300">Loading…</div> : null}
      {error ? <div className="text-sm text-red-700 dark:text-red-300">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4">
        {campaigns.map((c) => (
          <section
            key={c.id}
            className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-zinc-900 dark:text-zinc-50">{c.name}</div>
                {c.description ? <div className="text-sm text-zinc-600 dark:text-zinc-300">{c.description}</div> : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={buttonClass("ghost")}
                  disabled={!session?.user?.id || sessionLoading}
                  onClick={() =>
                    void (async () => {
                      const inv = await createCampaignInvite(c.id);
                      const link = `${baseUrl}join?token=${encodeURIComponent(inv.token)}`;
                      setInviteByCampaignId((prev) => ({ ...prev, [c.id]: link }));
                      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(link);
                    })()
                  }
                >
                  Create invite
                </button>
              </div>
            </div>
            {inviteByCampaignId[c.id] ? (
              <div className="mt-2 break-all rounded-lg border border-zinc-200 bg-white/50 px-3 py-2 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-200">
                {inviteByCampaignId[c.id]}
              </div>
            ) : null}

            <div className="mt-3 flex flex-col gap-2">
              <div className={smallLabelClass()}>Rulesets</div>
              <div className="flex flex-wrap gap-2">
                {c.rulesetIds.map((rid) => (
                  <span
                    key={rid}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/60 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200"
                  >
                    {rulesetName.get(rid) ?? rid}
                    <button
                      type="button"
                      className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      onClick={() =>
                        void (async () => {
                          await detachCampaignRuleset(c.id, rid);
                          await refresh();
                        })()
                      }
                      aria-label="Detach ruleset"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>

              <label className="mt-2 flex flex-col gap-1 sm:max-w-sm">
                <span className={smallLabelClass()}>Attach ruleset</span>
                <select
                  className={inputClassFull()}
                  value=""
                  onChange={(e) => {
                    const rid = e.target.value;
                    if (!rid) return;
                    void (async () => {
                      await attachCampaignRuleset(c.id, rid);
                      await refresh();
                    })();
                  }}
                >
                  <option value="">Select…</option>
                  {rulesets
                    .filter((r) => !c.rulesetIds.includes(r.id))
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

