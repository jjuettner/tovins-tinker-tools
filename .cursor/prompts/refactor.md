# Refactor prompt (folder structure)

Goal: clean, consistent structure. follow `.cursor/rules/architecture.mdc`.

## Structure rules (target)
- `src/app/`: app shell only (App, router, global providers)
- `src/pages/`: one file per route. page = layout + wiring only.
- `src/components/ui/`: generic reusable UI building blocks (Button, Input, Modal, etc)
- `src/components/features/{domain}/`: domain UI (characters, campaigns, etc)
- `src/hooks/`: custom hooks only. keep thin. no business logic.
- `src/lib/`: pure/domain logic + side-effectful services (db, supabase, normalize, combat, etc)
  - `src/lib/db/`: `{object}` modules (list{Object}, upsert{Object}, etc)
- `src/types/`: shared TS types (split by category: character, campaign, ruleset, etc)

## Boundaries (imports)
- `pages/` may import from `components/`, `hooks/`, `lib/`, `types/`
- `components/` may import from `hooks/`, `lib/`, `types/` only. never from `pages/`
- `lib/` imports: `lib/`, `types/` only. never from `components/` or `pages/`
- `hooks/` imports: `lib/`, `types/` only

## Move map (what goes where)
- route shell / mostly static markup -> `src/pages/*`
- interactive domain UI -> `src/components/features/{domain}/*`
- generic visual primitives -> `src/components/ui/*`
- non-React domain helpers (normalize, calculations, draft building, mapping) -> `src/lib/{domain}/*`
- shared shapes used in >1 file -> `src/types/*`
- similar named modules (ex. `dndData`, `dndRaces`, `dndSpells`) -> `src/lib/dnd/*` (or domain subfolder)

## Rules of thumb
- one component = one file
- prefer `{Thing}.tsx` for components; keep co-located component-only helpers in same file
- do not keep standalone `.ts` “business logic” under `components/` (move to `src/lib/...`)

## Examples (moves)
- `src/components/features/characters/characterDraft.ts` -> `src/lib/character/draft.ts`
- `src/lib/armorClass.ts` -> `src/lib/character/armorClass.ts` (or `src/lib/rules/armorClass.ts`, pick one)
- `src/lib/characterNormalize.ts` -> `src/lib/character/normalize.ts`

## Definition_of_Done (folder refactor)
- no `components/` -> `pages/` imports
- no `lib/` -> `components/` imports
- pages are 1 file per route
- domain logic moved out of `components/` into `lib/`
- shared types in `src/types/`, not re-declared ad-hoc across files
- naming: `components/ui/*` generic, `components/features/{domain}/*` domain-specific