import { requireSupabase } from "../supabase";

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

export async function listCampaigns(): Promise<Campaign[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("campaigns").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Campaign[];
}

export async function createCampaign(input: { name: string; description?: string | null }): Promise<Campaign> {
  const sb = requireSupabase();
  const { data: sessionData, error: sessionError } = await sb.auth.getSession();
  if (sessionError) throw sessionError;
  const uid = sessionData.session?.user?.id;
  if (!uid) throw new Error("Not signed in");

  const { data, error } = await sb
    .from("campaigns")
    .insert({ dm: uid, name: input.name, description: input.description ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data as Campaign;
}

export async function listCampaignRulesets(campaignId: string): Promise<string[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.from("campaign_rulesets").select("ruleset_id").eq("campaign_id", campaignId);
  if (error) throw error;
  return (data as { ruleset_id: string }[]).map((x) => x.ruleset_id);
}

export async function attachCampaignRuleset(campaignId: string, rulesetId: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("campaign_rulesets").insert({ campaign_id: campaignId, ruleset_id: rulesetId });
  if (error) throw error;
}

export async function detachCampaignRuleset(campaignId: string, rulesetId: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb
    .from("campaign_rulesets")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("ruleset_id", rulesetId);
  if (error) throw error;
}

