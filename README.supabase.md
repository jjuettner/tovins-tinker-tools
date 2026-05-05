# Supabase setup

- **client env** (Vite, safe to ship):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **seed env** (server-only, NEVER ship to client):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Migrations

- apply SQL in:
  - `supabase/migrations/0001_core.sql`
  - `supabase/migrations/0002_srd.sql`

## Seed SRD (dnd2024)

Create `.env.seed` (see `seed.env.example`), then:

```bash
npm run seed:dnd2024
```

Notes:
- creates/updates ruleset `dnd2024` with fixed id `00000000-0000-4000-8000-00000000d202`
- upserts SRD rows into `spells`, `classes`, `races`, `feats`, `equipment`, `features`, `traits`, `weapon_mastery_properties`, `class_spell_slots`

## Import extra ruleset (TCE)

Imports only entries with `book == "Tasha's Cauldron of Everything"` from `src/data/dnd5ejs/*`.

```bash
npm run import:tce
```

Creates `rulesets.slug = "tce"` if missing, then upserts into:
- `spells`
- `equipment` (items mapped into equipment rows)
- `classes`

## Local env files

- `.env.local`: put `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` for the app
- `.env.seed`: paste `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for `npm run seed:dnd2024` / `npm run import:tce` (template: `seed.env.example`)
- optional `.env`: extra vars; loaded after `.env.seed` if you want one shared file

## GitHub Pages (CI env)

Add GitHub repo secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Workflow passes them into `npm run build` in `.github/workflows/deploy-pages.yml`.

