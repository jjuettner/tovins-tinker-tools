import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadSeedEnv } from "./loadSeedEnv";

loadSeedEnv();

type JsonCondition = { index?: string; name?: string; description?: string };

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env var ${name}`);
  return v.trim();
}

const SUPABASE_URL = mustEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  realtime: { transport: ws as unknown as typeof WebSocket }
});

async function readJson<T>(relPath: string): Promise<T> {
  const p = resolve(process.cwd(), relPath);
  const raw = await readFile(p, "utf8");
  return JSON.parse(raw) as T;
}

async function main() {
  const raw = await readJson<JsonCondition[]>("src/data/PHB24/5e-Conditions.json");
  const rows = raw
    .map((c) => ({
      slug: typeof c.index === "string" ? c.index.trim().toLowerCase() : "",
      name: typeof c.name === "string" ? c.name.trim() : "",
      description: typeof c.description === "string" ? c.description.trim() : ""
    }))
    .filter((r) => r.slug && r.name);

  const { error } = await supabase.from("conditions").upsert(rows, { onConflict: "slug" });
  if (error) throw error;
  process.stdout.write(`seed conditions: ${rows.length} rows\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
