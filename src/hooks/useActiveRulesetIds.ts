import { useEffect, useMemo, useState } from "react";
import { listCampaignRulesets } from "@/lib/db/campaigns";
import { DND2024_RULESET_ID, listRulesets } from "@/lib/db/rulesets";

/**
 * For view/play screens (outside editor):
 * - if campaignId: use campaign rulesets (read-only)
 * - else: show all content (all rulesets)
 *
 * @param campaignId Campaign id (or null/undefined for "all rulesets").
 * @returns Active ruleset ids for content filtering.
 */
export function useActiveRulesetIds(campaignId: string | null | undefined) {
  const [allRuleIds, setAllRuleIds] = useState<string[] | null>(null);
  const [campaignRuleIds, setCampaignRuleIds] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (campaignId) return;
      try {
        const rs = await listRulesets();
        if (cancelled) return;
        setAllRuleIds(rs.map((r) => r.id));
      } catch {
        if (cancelled) return;
        setAllRuleIds([DND2024_RULESET_ID]);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!campaignId) {
        setCampaignRuleIds(null);
        return;
      }
      try {
        const ids = await listCampaignRulesets(campaignId);
        if (cancelled) return;
        setCampaignRuleIds(ids);
      } catch {
        if (cancelled) return;
        setCampaignRuleIds([DND2024_RULESET_ID]);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const activeRuleIds = useMemo(() => {
    if (campaignId) return campaignRuleIds && campaignRuleIds.length ? campaignRuleIds : [DND2024_RULESET_ID];
    return allRuleIds && allRuleIds.length ? allRuleIds : [DND2024_RULESET_ID];
  }, [campaignId, campaignRuleIds, allRuleIds]);

  return { activeRuleIds } as const;
}

