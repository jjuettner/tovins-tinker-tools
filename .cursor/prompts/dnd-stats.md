# Feature: DND Stat Sheet
1. in a new route, implement the following:
- "create character" form: name, game/world name, level, all dnd base stats (INT, CHA, etc.), proficiency in ability checks
- "modify character" form: modify values
- the input from the user is to be stored in the database, it should support multiple characters

2. Give out the character sheet. this can be done either in the same route with an "edit" mode switched off (default) or on a separate page
- show all ability check scores grouped with their base stats and saving throws. it should be a convenient lookup table for the player about what to add to their rolls
- defer proficiency bonus from the character level and a apply it to the proficient abilities
- example: 17 INT at level 5 with proficiency in investigation would mean a base  +3 from int stat + proficiency bonus of 3, so a total of +6
- output should be structured like this:
    - Intelligence (17): +3
        - (P) Saving Throw: +6
        - Arcana: +3
        - (P) History: +6
        - (other INT-affiliated ability checks)
