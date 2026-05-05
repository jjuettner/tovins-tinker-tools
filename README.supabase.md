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

```bash
SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." npm run seed:dnd2024
```

Notes:
- creates/updates ruleset `dnd2024` with fixed id `00000000-0000-4000-8000-00000000d202`
- upserts SRD rows into `spells`, `classes`, `races`, `feats`, `equipment`, `features`, `traits`, `weapon_mastery_properties`, `class_spell_slots`

## Local env files

- `.env.local`: put `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` for the app
- `.env.seed.example`: copy to `.env.seed.local` for seeding (service role key)

