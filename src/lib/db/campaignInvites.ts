import { requireSupabase } from "@/lib/supabase";

export type CampaignInvite = {
  token: string;
  expires_at: string;
};

/**
 * Create an invite token for a campaign.
 *
 * @param campaignId Campaign id.
 * @returns Token + expiry.
 */
export async function createCampaignInvite(campaignId: string): Promise<CampaignInvite> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("create_campaign_invite", { p_campaign_id: campaignId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") throw new Error("Invite creation failed");
  const token = "token" in row && typeof row.token === "string" ? row.token : null;
  const expiresAt = "expires_at" in row && typeof row.expires_at === "string" ? row.expires_at : null;
  if (!token || !expiresAt) throw new Error("Invite creation failed");
  return { token, expires_at: expiresAt };
}

/**
 * Join a campaign using an invite token.
 *
 * @param token Invite token.
 * @returns Campaign id joined.
 */
export async function joinCampaignWithInvite(token: string): Promise<string> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("join_campaign_with_invite", { p_token: token });
  if (error) throw error;
  if (typeof data !== "string") throw new Error("Join failed");
  return data;
}

