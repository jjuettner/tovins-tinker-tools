# Supabase Integration
- State Management now managed by Supabase
- Authentication against supabase
- way to store data used from data folder in supabase
  - keep general data available to every user
  - keep personal data (characters) to the individual users
  - have a campaign that users can be part of -> campaign data readable by members, writable by dm (admin)
  - way to add new entries (new spells, classes etc)

- keep different rulesets
  - data from src/data is standard ruleset (DnD2024)
  - new data has to be assigned to ruleset

# Refining

## Migration & Schema
- no keep characters: all new
  - played character: keep localStorage
- characters relates to campaign
- campaign relates to n rulesets
- SRD data moved over to supabase, any user can read
- port all used srd data to supabase, adjust schema to usecase -> add ruleset reference to spells, classes etc

## Auth & Access
- distinct roles: dm can change campaign data, admin can change all -> rulesets: only admin
- auth: option between (email+password) or magic link


