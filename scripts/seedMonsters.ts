/**
 * Bulk-import monsters from src/data/monsters.json into Supabase `monsters` table.
 *
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (see .env.seed / .env).
 * Run after applying migration 0003_monsters_encounters.sql.
 *
 * Usage: npm run seed:monsters
 */
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseChallenge, parseHitPoints } from "../src/lib/monsterParse";
import { loadSeedEnv } from "./loadSeedEnv";

loadSeedEnv();

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env var ${name}`);
  return v;
}

const SUPABASE_URL = mustEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  realtime: { transport: ws as unknown as typeof WebSocket }
});

type RawMonster = Record<string, unknown>;

function str(x: unknown): string {
  return typeof x === "string" ? x : "";
}

function numOrNull(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number.parseInt(x.trim(), 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseSignedMod(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  const m = s.match(/([+-]?\d+)/);
  if (!m) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

const BATCH = 250;

async function readJsonArray(relPath: string): Promise<unknown[]> {
  const p = resolve(process.cwd(), relPath);
  const s = await readFile(p, "utf8");
  if (!s.trim()) {
    throw new Error(`JSON file is empty: ${relPath}`);
  }
  const parsed = JSON.parse(s) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected JSON array in ${relPath}`);
  }
  return parsed;
}

async function main() {
  const defaultPath = "src/data/monsters.json";
  const relPath = process.env.MONSTERS_JSON_PATH?.trim() || defaultPath;
  const raw = await readJsonArray(relPath);

  const rows: Record<string, unknown>[] = [];

  raw.forEach((item, sourceIndex) => {
    const m = item as RawMonster;
    const name = str(m.name);
    const challenge = str(m.Challenge);
    const hpRaw = str(m["Hit Points"]);
    const { cr, xp } = parseChallenge(challenge);
    const { hp, hpDice } = parseHitPoints(hpRaw);

    rows.push({
      source_index: sourceIndex,
      name: name || `Unknown #${sourceIndex}`,
      cr,
      xp,
      hp,
      hp_dice: hpDice,
      ac: str(m["Armor Class"]) || null,
      meta: str(m.meta) || null,
      img_url: str(m.img_url) || null,
      str: numOrNull(m.STR),
      dex: numOrNull(m.DEX),
      con: numOrNull(m.CON),
      int: numOrNull(m.INT),
      wis: numOrNull(m.WIS),
      cha: numOrNull(m.CHA),
      str_mod: parseSignedMod(str(m.STR_mod)),
      dex_mod: parseSignedMod(str(m.DEX_mod)),
      con_mod: parseSignedMod(str(m.CON_mod)),
      int_mod: parseSignedMod(str(m.INT_mod)),
      wis_mod: parseSignedMod(str(m.WIS_mod)),
      cha_mod: parseSignedMod(str(m.CHA_mod)),
      saving_throws: str(m["Saving Throws"]) || null,
      skills: str(m.Skills) || null,
      traits_html: str(m.Traits) || null,
      actions_html: str(m.Actions) || null,
      legendary_html: str(m["Legendary Actions"]) || null
    });
  });

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("monsters").upsert(chunk, { onConflict: "source_index" });
    if (error) throw error;
    process.stdout.write(`Upserted ${Math.min(i + BATCH, rows.length)}/${rows.length}\n`);
  }

  process.stdout.write("Done.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
