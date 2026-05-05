import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadSeedEnv } from "./loadSeedEnv";

loadSeedEnv();

type Json = Record<string, unknown>;
type AnyRec = Record<string, unknown>;

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env var ${name}`);
  return v;
}

function asRec(x: unknown): AnyRec {
  return x && typeof x === "object" ? (x as AnyRec) : {};
}

function str(x: unknown): string {
  return typeof x === "string" ? x : "";
}

function num(x: unknown): number | null {
  return Number.isFinite(x as number) ? Number(x) : null;
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function readJson<T>(relPath: string): Promise<T> {
  const p = resolve(process.cwd(), relPath);
  const raw = await readFile(p, "utf8");
  return JSON.parse(raw) as T;
}

const SUPABASE_URL = mustEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

const BOOK_NAME = "Tasha's Cauldron of Everything";
const RULESET_SLUG = "tce";
const RULESET_NAME = "Tasha's Cauldron of Everything";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  realtime: { transport: ws as unknown as typeof WebSocket }
});

async function ensureRuleset(): Promise<string> {
  const { data: existing, error: readErr } = await supabase.from("rulesets").select("id").eq("slug", RULESET_SLUG).maybeSingle();
  if (readErr) throw readErr;
  if (existing?.id) return existing.id as string;

  const { data, error } = await supabase
    .from("rulesets")
    .insert({ slug: RULESET_SLUG, name: RULESET_NAME, description: `Imported from dnd5ejs: ${BOOK_NAME}`, is_builtin: false })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function batchUpsert(table: string, rows: unknown[], onConflict: string) {
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) throw error;
    process.stdout.write(`import ${table}: ${Math.min(i + chunk.length, rows.length)}/${rows.length}\n`);
  }
}

function pickProp(props0: unknown, key: string): unknown {
  const props = asRec(props0);
  return props[key];
}

function parseRange(desc: string, props0: unknown): string | null {
  const fromProp = str(pickProp(props0, "data-RangeAoe"));
  if (fromProp) return fromProp;
  const m = desc.match(/\bRange:\s*([^\n]+?)(?:\s+Components:|\s+Duration:|$)/i);
  return m ? m[1].trim() : null;
}

function parseDuration(desc: string): { duration: string | null; concentration: boolean | null } {
  const m = desc.match(/\bDuration:\s*([^\n]+?)(?:\s+You |\s+At Higher Levels\.|$)/i);
  const d = m ? m[1].trim() : null;
  const conc = d ? /concentration/i.test(d) : /\bconcentration\b/i.test(desc);
  return { duration: d, concentration: d ? conc : null };
}

function parseCastingTime(desc: string, props0: unknown): string | null {
  const p = str(pickProp(props0, "Casting Time"));
  if (p) return p;
  const m = desc.match(/\bCasting Time:\s*([^\n]+?)(?:\s+Range:|\s+Components:|$)/i);
  return m ? m[1].trim() : null;
}

async function importSpells(rulesetId: string) {
  const all = await readJson<unknown[]>("src/data/dnd5ejs/spells.json");
  const tce = all.map(asRec).filter((e) => str(e.book) === BOOK_NAME);

  const rows = tce.map((e) => {
    const props = e.properties;
    const desc = str(e.description);
    const name = str(e.name);
    const level = num(pickProp(props, "Level")) ?? 0;
    const school = str(pickProp(props, "School")) || null;
    const casting_time = parseCastingTime(desc, props);
    const range_text = parseRange(desc, props);
    const { duration, concentration } = parseDuration(desc);
    const ritual = /\britual\b/i.test(desc) ? true : null;

    return {
      ruleset_id: rulesetId,
      slug: slugify(name),
      name,
      level,
      school,
      casting_time,
      range_text,
      duration,
      concentration,
      ritual,
      classes: null,
      data: e as Json
    };
  });

  await batchUpsert("spells", rows.filter((r) => r.slug && r.name), "ruleset_id,slug");
}

async function importItemsAsEquipment(rulesetId: string) {
  const all = await readJson<unknown[]>("src/data/dnd5ejs/items.json");
  const tce = all.map(asRec).filter((e) => str(e.book) === BOOK_NAME);

  const rows = tce.map((e) => {
    const props = e.properties;
    const name = str(e.name);
    const category = str(pickProp(props, "Category")) || null;
    return {
      ruleset_id: rulesetId,
      slug: slugify(name),
      name,
      category,
      weapon_category: null,
      armor_category: null,
      cost: null,
      weight: null,
      data: e as Json
    };
  });

  await batchUpsert("equipment", rows.filter((r) => r.slug && r.name), "ruleset_id,slug");
}

async function importClasses(rulesetId: string) {
  const all = await readJson<unknown[]>("src/data/dnd5ejs/classes.json");
  const tce = all.map(asRec).filter((e) => str(e.book) === BOOK_NAME);

  const rows = tce.map((e) => {
    const name = str(e.name);
    const props = e.properties;
    const hitDie = num(pickProp(props, "Hit Die"));
    return { ruleset_id: rulesetId, slug: slugify(name), name, hit_die: hitDie, data: e as Json };
  });

  await batchUpsert("classes", rows.filter((r) => r.slug && r.name), "ruleset_id,slug");
}

async function main() {
  const rulesetId = await ensureRuleset();
  await importSpells(rulesetId);
  await importItemsAsEquipment(rulesetId);
  await importClasses(rulesetId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
