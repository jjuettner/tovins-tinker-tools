import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadSeedEnv } from "./loadSeedEnv";

loadSeedEnv();

type Json = Record<string, unknown>;

type AnyRec = Record<string, unknown>;

function asRec(x: unknown): AnyRec {
  return x && typeof x === "object" ? (x as AnyRec) : {};
}

function str(x: unknown): string {
  return typeof x === "string" ? x : "";
}

function num(x: unknown): number | null {
  return Number.isFinite(x as number) ? Number(x) : null;
}

function boolOrNull(x: unknown): boolean | null {
  return typeof x === "boolean" ? x : null;
}

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env var ${name}`);
  return v;
}

const SUPABASE_URL = mustEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

// Fixed UUID so client code can hardcode dnd2024 ruleset id.
export const DND2024_RULESET_ID = "00000000-0000-4000-8000-00000000d202";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  realtime: { transport: ws as unknown as typeof WebSocket }
});

async function readJson<T>(relPath: string): Promise<T> {
  const p = resolve(process.cwd(), relPath);
  const raw = await readFile(p, "utf8");
  return JSON.parse(raw) as T;
}

async function upsertRuleset() {
  const { data: existing, error: readErr } = await supabase
    .from("rulesets")
    .select("id, slug, is_builtin")
    .eq("slug", "dnd2024")
    .maybeSingle();
  if (readErr) throw readErr;
  if (existing) return;

  const { error: insertErr } = await supabase.from("rulesets").insert({
    id: DND2024_RULESET_ID,
    slug: "dnd2024",
    name: "D&D 2024 SRD",
    description: "Seeded from local SRD JSON files.",
    is_builtin: true
  });
  if (insertErr) throw insertErr;
}

function mapSpell(s0: unknown) {
  const s = asRec(s0);
  const school = asRec(s.school);
  const classes = Array.isArray(s.classes) ? s.classes.map((c) => str(asRec(c).index)).filter(Boolean) : null;
  return {
    ruleset_id: DND2024_RULESET_ID,
    slug: str(s.index),
    name: str(s.name),
    level: num(s.level) ?? 0,
    school: str(school.name) || null,
    casting_time: str(s.casting_time) || null,
    range_text: str(s.range) || null,
    duration: str(s.duration) || null,
    concentration: boolOrNull(s.concentration),
    ritual: boolOrNull(s.ritual),
    classes: classes && classes.length > 0 ? classes : null,
    data: s as Json
  };
}

function mapClass(c0: unknown) {
  const c = asRec(c0);
  return {
    ruleset_id: DND2024_RULESET_ID,
    slug: str(c.index),
    name: str(c.name),
    hit_die: num(c.hit_die),
    data: c as Json
  };
}

function mapRace(r0: unknown) {
  const r = asRec(r0);
  return { ruleset_id: DND2024_RULESET_ID, slug: str(r.index), name: str(r.name), data: r as Json };
}

function mapFeat(f0: unknown) {
  const f = asRec(f0);
  return {
    ruleset_id: DND2024_RULESET_ID,
    slug: str(f.index),
    name: str(f.name),
    feat_type: str(f.type) || null,
    repeatable: str(f.repeatable) || null,
    description: str(f.description) || null,
    data: f as Json
  };
}

function mapEquipment(e0: unknown) {
  const e = asRec(e0);
  const cat = asRec(e.equipment_category);
  return {
    ruleset_id: DND2024_RULESET_ID,
    slug: str(e.index),
    name: str(e.name),
    category: str(cat.name) || null,
    weapon_category: str(e.weapon_category) || null,
    armor_category: str(e.armor_category) || null,
    cost: (e.cost as unknown) ?? null,
    weight: num(e.weight),
    data: e as Json
  };
}

function mapFeature(f0: unknown) {
  const f = asRec(f0);
  const cls = asRec(f.class);
  const sub = asRec(f.subclass);
  return {
    ruleset_id: DND2024_RULESET_ID,
    slug: str(f.index),
    name: str(f.name),
    class_slug: str(cls.index) || null,
    subclass_slug: str(sub.index) || null,
    level: num(f.level),
    data: f as Json
  };
}

function mapTrait(t0: unknown) {
  const t = asRec(t0);
  const races = Array.isArray(t.races) ? t.races.map((x) => str(asRec(x).index)).filter(Boolean) : null;
  return {
    ruleset_id: DND2024_RULESET_ID,
    slug: str(t.index),
    name: str(t.name),
    races: races && races.length > 0 ? races : null,
    data: t as Json
  };
}

function mapWeaponMastery(w0: unknown) {
  const w = asRec(w0);
  const desc = Array.isArray(w.desc) ? (w.desc as unknown[]).map((x) => str(x)).filter(Boolean).join("\n") : "";
  return {
    ruleset_id: DND2024_RULESET_ID,
    slug: str(w.index),
    name: str(w.name),
    description: desc || null,
    data: w as Json
  };
}

async function batchUpsert(table: string, rows: unknown[], onConflict: string) {
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) throw error;
    process.stdout.write(`seed ${table}: ${Math.min(i + chunk.length, rows.length)}/${rows.length}\n`);
  }
}

type SlotRow = Record<string, number> & { level: number };
type SpellSlotsFile = {
  full_casters: { classes: string[]; slots_per_level: SlotRow[] };
  half_casters: { classes: string[]; slots_per_level: SlotRow[] };
  pact_magic: { classes: string[]; slots_per_level: { level: number; slots: number; slot_level: number }[] };
};

const SPELL_LEVEL_KEYS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"] as const;

function slotRowToArray(row: SlotRow): number[] {
  return SPELL_LEVEL_KEYS.map((k) => {
    const n = row[k];
    return typeof n === "number" && n > 0 ? n : 0;
  });
}

async function seedSpellSlots(nameToSlug: Map<string, string>) {
  const raw = await readJson<SpellSlotsFile>("src/data/spell-slots.json");

  const rows: { ruleset_id: string; class_slug: string; level: number; slots: unknown }[] = [];

  function addStandard(className: string, row: SlotRow) {
    const slug = nameToSlug.get(className) ?? "";
    if (!slug) return;
    rows.push({
      ruleset_id: DND2024_RULESET_ID,
      class_slug: slug,
      level: row.level,
      slots: { kind: "standard", perSpellLevel: slotRowToArray(row) }
    });
  }

  for (const className of raw.full_casters.classes) {
    raw.full_casters.slots_per_level.forEach((r) => addStandard(className, r));
  }
  for (const className of raw.half_casters.classes) {
    raw.half_casters.slots_per_level.forEach((r) => addStandard(className, r));
  }

  for (const className of raw.pact_magic.classes) {
    const slug = nameToSlug.get(className) ?? "";
    if (!slug) continue;
    raw.pact_magic.slots_per_level.forEach((r) => {
      rows.push({
        ruleset_id: DND2024_RULESET_ID,
        class_slug: slug,
        level: r.level,
        slots: { kind: "pact", max: r.slots, slotSpellLevel: r.slot_level }
      });
    });
  }

  await batchUpsert("class_spell_slots", rows, "ruleset_id,class_slug,level");
}

async function main() {
  await upsertRuleset();

  const spells = await readJson<unknown[]>("src/data/5e-SRD-Spells.json");
  const classes = await readJson<unknown[]>("src/data/5e-SRD-Classes.json");
  const races = await readJson<unknown[]>("src/data/5e-SRD-Races.json");
  const feats = await readJson<unknown[]>("src/data/5e-SRD-Feats.json");
  const equipment = await readJson<unknown[]>("src/data/5e-SRD-Equipment.json");
  const features = await readJson<unknown[]>("src/data/5e-SRD-Features.json");
  const traits = await readJson<unknown[]>("src/data/5e-SRD-Traits.json");
  const weaponMastery = await readJson<unknown[]>("src/data/5e-SRD-Weapon-Mastery-Properties.json");

  await batchUpsert("spells", spells.map(mapSpell).filter((x) => x.slug && x.name), "ruleset_id,slug");
  await batchUpsert("classes", classes.map(mapClass).filter((x) => x.slug && x.name), "ruleset_id,slug");
  await batchUpsert("races", races.map(mapRace).filter((x) => x.slug && x.name), "ruleset_id,slug");
  await batchUpsert("feats", feats.map(mapFeat).filter((x) => x.slug && x.name), "ruleset_id,slug");
  await batchUpsert("equipment", equipment.map(mapEquipment).filter((x) => x.slug && x.name), "ruleset_id,slug");
  await batchUpsert("features", features.map(mapFeature).filter((x) => x.slug && x.name), "ruleset_id,slug");
  await batchUpsert("traits", traits.map(mapTrait).filter((x) => x.slug && x.name), "ruleset_id,slug");
  await batchUpsert("weapon_mastery_properties", weaponMastery.map(mapWeaponMastery).filter((x) => x.slug && x.name), "ruleset_id,slug");

  const nameToSlug = new Map<string, string>();
  classes.forEach((c0) => {
    const c = asRec(c0);
    const name = str(c.name);
    const slug = str(c.index);
    if (name && slug) nameToSlug.set(name, slug);
  });
  await seedSpellSlots(nameToSlug);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

