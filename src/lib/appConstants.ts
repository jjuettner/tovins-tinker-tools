/** URL path segment when deployed to GitHub Pages (must match repo name). */
export const APP_REPO_SLUG = "tovins-tinker-tools";

const PREFIX = APP_REPO_SLUG;

export const APP_DISPLAY_NAME = "Tovin's Tinker Tools";

export const STORAGE_KEYS = {
  themeDark: `${PREFIX}.theme.dark`,
  characters: `${PREFIX}.dnd.characters`,
  usedCharacterId: `${PREFIX}.dnd.usedCharacterId`,
  usedCampaignId: `${PREFIX}.dnd.usedCampaignId`
} as const;
