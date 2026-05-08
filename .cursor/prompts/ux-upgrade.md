
## Compendium
  - in draft mode: add button top right of detail window
  - image: bigger, show more, normalize ratio so all look good
  - image: when cropping vertically. show top part, not center
  - image clickable -> show full in overlay
  

## Draft
  - encounter list
    - extract as own component
  - encounter info panel
    - extract as own component
  - encounter list row
    - remove buttons
    - move to encounter info panel
  - 2 column layout on desktop
     - left: encounter list
     - right: encounter info
  - change
    - mobile: keep previous layout (list, info, compendium; vertical)
    - desktop
      - monster compendium in the middle
      - side bar left: encounter list
      - side bar right: encounter info
      - ![1778250625456](image/ux-upgrade/1778250625456.png)
        - sidebars floating left and right where empty space is
      - sidebar positioning is good, but take more vertical space
      - center content (monsters): take up entire with of main content area

      - remove standalone compendium tab from draft
      - compendium add buttons: add plus icon and change button to be darker

## run encounter row
- Avatar Frame
  - inspiration: hearthstone hero cards
  - Bottom: Flat
  - Top: half circle
  - position: lining up with left side of row, circular top part extending upward past the row itself 

  - default pc avatars should have consistent background color. is not filled out entirely yet
  - frames bigger. borders bigger. gold border for pc, silver border for enemy
  - stat block in encouter row more compact
    - 2 rows, aligned right, text left

## Player avatar
  - allow upload of image
  - add image to character
  - display avatar of selected character on top menu

  - create avatar component
    - on character create, select class specific default
    - upload dialog = click avatar -> hover caption "change"
    - show uploaded image
    - use this in character edit instead of file upload button
    - show in character list
    - use in encounter row
  
  - character list
    - layout:  portrait left, text right
  - character edit: read only mode
    - show avatar in title 
      - left avatar
      - right everything else
  - when changing used character update top user icon in real time

## menu
  - new menu layout
  - Play -> PlayFeature
  - Compendium -> Tabs for different objects -> only monsters currently
  - DM 
    - Campaigns
    - Encounter
  - User Icon (interactible)
    - Manage Characters


## player card
  - short number input  with icon buttons 
    - (drop) damage (-> opens damage form)
    - cross (bold plus symbol) -> heal


# General

## Number inputs
  - centralized input element
  - auto format to 2 digit number < 40 on roll/skill check related inputs
    - ex. initiative, ability score
  - no leading zeroes
  - format on blur. no interfere while typing

  ## Colors
  - highlight and button colors: with less contrast -> white is too much
  - apply everywhere
  - define globally for easy edits