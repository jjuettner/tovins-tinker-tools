import { config } from "dotenv";
import { resolve } from "node:path";

/**
 * Load server-only Supabase credentials for seed/import scripts.
 * Paste keys into `.env.seed` (gitignored). Optional `.env` overrides / shared vars.
 */
export function loadSeedEnv(cwd = process.cwd()) {
  config({ path: resolve(cwd, ".env.seed") });
  config({ path: resolve(cwd, ".env") });
}
