import { requireSupabase } from "@/lib/supabase";

export type Campaign = {
  id: string;
  dm: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type CampaignRulesetRow = {
  campaign_id: string;
  ruleset_id: string;
  created_at: string;
};

/**
 * List campaigns (most recent first).
 *
 * @returns Campaign rows.
 */
export async function listCampaigns(): Promise<Campaign[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("campaigns").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Campaign[];
}

/**
 * Create campaign owned by current user.
 *
 * @param input Campaign create payload.
 * @returns Nothing.
 * @throws If not signed in.
 */
export async function createCampaign(input: { name: string; description?: string | null }): Promise<void> {
  const sb = requireSupabase();
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData.user?.id) throw new Error("Not signed in");

  const { error } = await sb.from("campaigns").insert({ name: input.name, description: input.description ?? null });
  if (error) throw error;
}

/**
 * List ruleset ids attached to campaign.
 *
 * @param campaignId Campaign id.
 * @returns Ruleset ids.
 */
export async function listCampaignRulesets(campaignId: string): Promise<string[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("campaign_rulesets").select("ruleset_id").eq("campaign_id", campaignId);
  if (error) throw error;
  return (data as { ruleset_id: string }[]).map((x) => x.ruleset_id);
}

/**
 * Attach ruleset to campaign.
 *
 * @param campaignId Campaign id.
 * @param rulesetId Ruleset id.
 * @returns Nothing.
 */
export async function attachCampaignRuleset(campaignId: string, rulesetId: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("campaign_rulesets").insert({ campaign_id: campaignId, ruleset_id: rulesetId });
  if (error) throw error;
}

/**
 * Detach ruleset from campaign.
 *
 * @param campaignId Campaign id.
 * @param rulesetId Ruleset id.
 * @returns Nothing.
 */
export async function detachCampaignRuleset(campaignId: string, rulesetId: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb
    .from("campaign_rulesets")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("ruleset_id", rulesetId);
  if (error) throw error;
}

