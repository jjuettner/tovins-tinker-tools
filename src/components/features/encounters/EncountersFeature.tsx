import { Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buttonClass } from "@/components/ui/controlClasses";
import { useProfile } from "@/lib/auth";
import { STORAGE_KEYS } from "@/lib/appConstants";
import { listCampaigns, type Campaign } from "@/lib/db/campaigns";
import { useStoredState } from "@/hooks/useStoredState";
import EncounterDraftPanel from "@/components/features/encounters/EncounterDraftPanel";
import EncounterPlayPanel from "@/components/features/encounters/EncounterPlayPanel";
type Tab = "draft" | "play";

export function EncountersFeature() {
  const { profile, loading: profileLoading } = useProfile();
  const { value: campaignId, setValue: setCampaignId } = useStoredState<string | null>(STORAGE_KEYS.usedCampaignId, null);
  const { value: encounterId, setValue: setEncounterId } = useStoredState<string | null>(STORAGE_KEYS.usedEncounterId, null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("draft");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const cs = await listCampaigns();
        if (!cancelled) setCampaigns(cs);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load campaigns");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCampaign = useMemo(() => campaigns.find((c) => c.id === campaignId) ?? null, [campaigns, campaignId]);

  const canDm = Boolean(profile && activeCampaign && (profile.is_admin || activeCampaign.dm === profile.id));

  if (profileLoading || loading) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  if (!profile) {
    return <p className="text-sm text-red-600">Sign in to manage encounters.</p>;
  }

  if (error && campaigns.length === 0) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!campaignId) {
    return (
      <div className="flex flex-col gap-4">
        <header className="flex flex-wrap items-start gap-3">
          <Swords className="h-8 w-8 shrink-0 text-zinc-700 dark:text-zinc-200" aria-hidden="true" />
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Encounters</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Choose an active campaign (stored locally, like Play mode).</p>
          </div>
        </header>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <section className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">No campaigns yet. Create one under Campaigns.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {campaigns.map((c) => {
                const isDm = profile.is_admin || c.dm === profile.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
                      onClick={() => setCampaignId(c.id)}
                    >
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">{c.name}</span>
                      <span className="text-xs text-zinc-500">{isDm ? "DM" : "Player"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    );
  }

  if (!activeCampaign) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p>Stored campaign not found. It may have been removed.</p>
        <button type="button" className={buttonClass("primary") + " mt-3"} onClick={() => setCampaignId(null)}>
          Pick another campaign
        </button>
      </div>
    );
  }

  if (!canDm) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Encounters are available to the <span className="font-medium">campaign DM</span> or admins only.
        </p>
        <button type="button" className={buttonClass("primary") + " mt-3"} onClick={() => setCampaignId(null)}>
          Choose a different campaign
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-start gap-3">
          <Swords className="h-8 w-8 shrink-0 text-zinc-700 dark:text-zinc-200" aria-hidden="true" />
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Encounters</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Campaign: <span className="font-medium text-zinc-900 dark:text-zinc-50">{activeCampaign.name}</span>
            </p>
          </div>
        </div>
        <button type="button" className={buttonClass("ghost")} onClick={() => setCampaignId(null)}>
          Change campaign
        </button>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        {(
          [
            ["draft", "Draft"],
            ["play", "Play"]
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={
              "rounded-md px-3 py-1.5 text-sm font-medium transition " +
              (tab === id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800")
            }
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "draft" ? (
        <EncounterDraftPanel
          campaignId={campaignId}
          onRunEncounter={(id) => {
            setEncounterId(id);
            setTab("play");
          }}
        />
      ) : null}
      {tab === "play" ? <EncounterPlayPanel campaignId={campaignId} encounterId={encounterId} /> : null}
    </div>
  );
}
