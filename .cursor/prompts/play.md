# Play Mode Feature

## Prerequisites
- wherever you show Proficiency with "(P)", change it to an icon of a circle with the left half filled in
- enable adding weapons at character create / edit
  - autocomplete search on items from data
  - enable adding modifiers, e.g. +1 to a greataxe
- enable adding armor on character creation
  - calculate AC depending on armor and save to character
- on character list, have a button that says "use character", that saves your currently used character to be used in play mode

## Play mode Feature
I need a page: "Play" mode
- use the "used character" 
- Character Header (top, spanning all tabs)
  - Show Character Name, HP, current HP, maximum HP, temp HP, AC
  - Show a button for Rest (icon: campfire or tent)
    - opens Dialog Short Rest/ Long Rest
    - Short Rest should prompt for recovered HP (optional)
    - Long Rest should reset all HP and spell slots
- Tab navigation below Header
  - a tab "Skills" that lists the skill checks like in the character page
  - a tab "Spells" 
    - compact overview of spell slots available , Featuring the spell level, number left and total number available
      - available spell slots depend on character and level (get from data)
    - shows prepared spells to cast
      - show spell as inactive if you dont have enough spell slots left
    - able to tap a spell to use
      - on use: ask for upcasting and be able to select the level you want to upcast the spell with
      - deduct the used spell slot from available ones
  - a tab "Combat"
    - function button to take damage (drop of blood icon)
      - show one row of a form, default to physical damage type and input for number
      - form can be expanded  ("+" icon) to add another damage type
      - on submit, deduct HP, (temp HP first)
    - list attacks
      - attack depending on carried weapons
      - default ways to attack
      - display bonus on hit depending on stats, feats and weapon modifiers
      - on attack click (button with a sword next to attack)
        - show dice to be rolled
          - select hit/miss
          - miss: disable popup
          - hit: display: damage bonuses, combat related feats this character has e.g. great weapons master etc. as a dismissable popup

## Blockers 

- Where state lives: local storage vs app store vs backend.
  - state lives in localstorage now, later will be migrated to supabase -> now localstorage only


- Rules source: where “spell slots by class+level” comes from in src/data/.
  - src/data/spell-slots.json


- Weapon/armor model: how you store “carried”, “equipped”, and “+1” modifiers.
  - save on character
    - equipped: array of equipment
    - modifier: extra field on piece of equipment
  - we dont care about carried items yet


## Refining

- Character edit: 
  - select race at character create
  - Modify and delete only in Detail (right side), not in the selection list
    - "play character" also goes there. small icon in list to indicate currently used character
  - Spells
    - Divider between each spell level, alphabetic sorting within same level
  - Add Weapons
    - ability to select mastery for weapon -> save like modifier
    - only show search when adding new weapon, after selection only keep weapon name, mastery option + bonus on screen
  
- Character Skill Sheet component
  - remove "()" around Scores
  - empty circle instead of half filled for skills without proficiency
  - make foldable (only in character edit) (button toggle), 
  
- Play mode
  - combat tab before spells, rename "Skills" Tab to "General", display Traits and Feats underneath
  - display the mastery property in play mode attack dialog when mastery is selected for weapon


## Refining II
- Play 
  - Main Character Card
    - Format a Card
      - Display Class
      - Heart Symbol for "HP" Caption
        - Use Colors: Green Healthy -> Yellow Medium -> Red critical
      - Tmp HP as ( + X ) behind HP - only if available
  - General
    - Proficiency Circle -> Left half filled in, not the right half
  - Spells
    - Right Part of list item: Cast Button
    - Left Part: Open Description of Spell -> Format a Spell Card
  - Combat
    - "hit" replace with crosshair Symbol
    - damage: fitting icon, explosion icon or similar
    - consistent spacing attack, hit, damage
- Characters
  - Collapse Skill check categories
  - Filter Spells for usable by class
