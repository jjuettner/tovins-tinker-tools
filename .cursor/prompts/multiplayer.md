# Multiplayer Features
  - new accounts have to be able to join other users' campaigns
  - when encounter is ongoing, PC's health should be updating as they modify it
  - no constant polling needed, update on "next turn"

  - invite still doesnt work
    error {
    "code": "42883",
    "details": null,
    "hint": "No function matches the given name and argument types. You might need to add explicit type casts.",
    "message": "function digest(bytea, unknown) does not exist"
}

# User Profile
  - Let User edit their displayName

# Problems

## Caharcter Visibility
- Account 1 is dm for campaign A
- Account 2 is DM for campaign B
- Acc 2 invites Acc1 to campaign B
--> Account 1 sees Account 2's character

- character list
 - if admin
  - show own characters first
  - show other account characters after
    - separate section with divider. divider shows account name / email

## selected character not showing
- Play mode shows "choose character" but character is chosen in localstorage

- artificer character selected, spells disabled

## update PC HP
  - Acc2("DM") running an encounter
  - Acc1("player") has character "tovin" in campaign
  - Player (Acc1) is in play mode. adds 2 damage to hp. now 32/34
  - DM clicks "next turn"
    - Tovin HP does not update
  - dont keep PC HP in encounter, get from character on "next turn"

  - implement "healing" interface in character play combat tab
  - fix rest menu
    - options: short rest: get hp | long rest: full hp, full spell slots
  
  - short rest: do not touch temp hp, ask for hp healed instead
  - heal interface
    - separate card, with title, but on the same height as damage
    - same row as damage
    - checkbox for temp hp. uncheck after submit

- prevent save in character editor when assigning character to a campaign that does not have ruleset for class


- character fropm Acc2 changed ownership to Acc1
- can not edit character anymore on Acc2
- separation between own character and other characters (admin) is gone

- implement visual error when (and why) something cannot be edited (supabase 403)
	- include a global error handler for this
- acc2 sees character from acc1 in character list
	- should not be the case
	- character is part of acc2's campaign

 - encounter turn order
	- change health with dmg/heal should update character
	- dm can add/remove conditions for pcs