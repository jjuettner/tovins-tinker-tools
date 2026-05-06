# Encounter Feature

This lets a dm create an encounter, plan players and monsters present.
Prerequisites / Subfeatures: Monster Compendium, Draft Mode, Play Mode

- accessible only to dms and admins
- reuse components for other parts
- create encounter page
- persist encounters in db
- encounter.status = draft, ongoing, finished
- for HP display, reuse from Character Play mode -> extract to own component

## Subfeature: Monster Compendium
- data: data/monsters.json -> import to supabase
- Formatting
  - "Challenge" key: extract CR and XP into different fields
  - "Hit Points" key: extract {Hit Points} ({HP Dice}) separate fields
- searchable list, sortable by name, challenge rating
  - detail view: show card for monster
    - Name, AC, image, stat block, actions, traits -> compact but organized

## Draft Mode
- can create an encounter
- encounter contains n players + n monsters
- choose monsters from searchable list (include Monster Compendium UI, see below)
- keep track of challenge rating (sum of CR of all Monsters)
- always has campaign as the context
- ability to save encounter


## Play Mode
- Round counter on top, start at 1
- show list of all entities in encounter
  - list item: name & HP readonly, buttons: DMG/Heal = lower/add HP
- assign initiative per entity
- initiative 0: standby, does not take part
  - initiative can always be updated
- button "start"
  - create an instance of each monster (initialize HP from monster data)
  - show list of entities, ordered by initiative
    - entity list entry: Name, HP
  - select first entity
  - expand card for selected entity
- button "next"
  - cycle to next entity, set selected
  - when at the end of the list, cycle back to the first entry
    - ignore initiative 0 entries
    - increase round counter by 1


## Feedback
- do not lock interactions based on status
  - ongoing still editable
- edits on encounter list
  - actions to delete encounter or change status
- delete option for finished encounters
- play mode
  - Entities with 0 HP should not be in the cycle anymore and should be sorted at the bottom when turn is finished
  - the active entity should have the card shown for them
  - for downed Player Characters, add a death saving throw counter
    - if theyre at 0HP, offer success or fail
    - provide an interface with 3 red circles and 3 green circles (outline only)
      - success on their turn will fill one green circle
      - fail will fill one red circle
      - when 3 red circles -> dead
      - when 3 red circles -> alive with 1 HP
  - add status pills onto entities
    - for now, introduce "dead" status (add a skull icon to it)
    - gets applied when a monster dies or a Player has 3 failed saves

- monster card
  - show basic stats and modifiers for skill checks


- monsters get the dead status immediately at 0 HP
  - players get downed at 0HP and dead at 3 failed saves
- dont use a card button on the entity row, instead render the card inline into the row
  - add stats to row when selected


- only "dead" at the bottom
  - "downed" still in order
- non PC get "dead" immediately

- change how list works
  - on "next turn" pop top entry and insert at the bottom, right above all the dead entities

- selecting fail or success also activates the next turn automatically
- remove the dead status from entities when they gain hp and put them back on the rotation


- in draft mode, dont clear the search when adding monsters