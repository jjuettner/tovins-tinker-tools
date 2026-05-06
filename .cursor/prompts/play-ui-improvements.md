# Play UI Improvements

- hpHeartClass to components / ui
- slice into separate files: header, each tab
- PlayHeader
  - if caster (has spell slots + knows spells) -> display spell attack modifier, spell save dc
    - look up how to calculate, get primary stat from class
    - display as separate column between name and actions menu (Rest button)
  - if not caster, show spells tab as inactive
  - show class + race resources (rage charges, channel divinity, heroic inspiration)
