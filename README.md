# Custom Compendium v0.1.0

Custom Compendium browser extension for Roll 20. Manage repeating entries with a drag & drop UI to save custom Spells, Traits, Items & Proficiencies. Organise them into Collections so you can drop custom Classes, Races, Feats and Background straight onto your character.
Very early development!

Currently supported:
  - browsers: FireFox, Chrome
  - character sheets: dnd5e by Roll20

## What this is:

A drag & drop storage facility for customised character sheet data. The purpose of this extension is to allow easy and ready access to customised repeating entries, and to be able to move them between campaigns. This is a convenience storage method, and nothing more - it doesn't enable anything that can't currently be done with some tiresome copy & pasting.

## What this is not:

A real Custom Compendium. Adding the ability to mass-import/export characters, NPCs, handouts and so forth, would be infringing on the Pro-level Transmogrifier functionality, and is never going to be part of this project. The concept is to add missing functionality, not to upset Roll20.

## Installation

Download the latest version. Place in a folder somewhere on your PC.

**Chrome**:
  1. Enable developer mode - https://developer.chrome.com/docs/extensions/mv3/getstarted/#manifest
  2. Load the unpacked extension from the root folder \customCompendium\, cointaining CHROME MANIFEST and manifest.json
  3. If your Roll20 campaign is already loaded, you will probably need to refresh the page (F5)

**FireFox**:
  1. Navigate to about:debugging - https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/
  2. Click "load temporary addon" and navigate to \customCompendium\ff\, the folder containing FIREFOX MANIFEST and manifest.json
  3. Double-click on **manifest.json**
  4. The extension should start loading if your Roll20 campaign is open, or will load when you next open it

# Quick Start - Basic Use:
Adding to the Compendium (GM Only):
  1. Get all of your homebrew/modified content the way you want it on a character sheet, for example a sheet called "Homebrew Spells" with all of thet modified spells right there on the sheet. You possibly already have this part done.
  2. Create a New Compendium, or just use the Default, and make sure it is selected.
  3. Toggle "Sheet Thief" mode, and drag the items you want from the character sheet to the drop target in the Custom Compendium UI.
  4. To create a Collection of entries (e.g. Class, Background) select the relevant category, click the "+ New" button and select a name & subcategory. Now click the Edit button next to the new entry.
  5. Toggle the "Add Item" button within the Edit Collection dialog. This enabled drag & drop from the main UI to the required tier of the Collection.

Dropping to a Character Sheet (GM and Player):
  1. Items: simply drag & drop the Item you want to the character sheet.
  2. Collections: drag & drop the Collection you want. You should then see a pop-up where you can select which tiers to drop: for example, if you've created a new Level 10 character with the custom class Fool, drag & drop the Fool class entry, the check the boxes for levels 1 through 10.

# The interface:
![basicUI](https://user-images.githubusercontent.com/74662220/123499294-ddc29780-d674-11eb-9e93-8e4ceb762293.png)
1. Mini Icon - this can be dragged left and right to desired position. In case the main UI somehow gets lost at sea, a double-right-click will restore it to the middle of the screen with a preset height.
2. Header & Minimise Button - The frame can be dragged around by the Header. Double-click the Header to collapse the frame. Click the Minimise Button to close the main UI. Left-clicking the Mini Icon at the top of the canvas will restore the frame.

## GM controls:
These controls are GM-only and hidden from players.
![gmUI](https://user-images.githubusercontent.com/74662220/123500050-4fe9ab00-d67a-11eb-8ac0-35c1fdc124ab.png)

1. Compendium Controls:
  - Control the currently active Profile from the drop-down.
  - Create a new Profile or delete an existing one with the relevant buttons.
  - Items and Collections can exist under multiple Profiles if you wish.
  - 
2. Import & Export:
  - Export the current Profile (only the currently-selected Profile in the drop-down) as a JSON. Good for backing up your work, or trasnferring between Campaigns.
  - Import from JSON (only a JSON created by Custom Compendium) to the currently selected Compendium Profile.
  - You can use these to merge Profiles, for example: 
     i) select Custom Spells Profile => export to JSON. 
     ii) select Custom Traits Profile => export to JSON.
     iii) create New Profile: Homebrew
     iv) select Profile: Homebrew
     v) import Custom Spells.JSON
     vi) import Custom Traits.JSON
     vii) the Homebrew profile now contains all the data from your Spells & Traits compendiums

3. Sheet Thief Mode:
  - This is the primary method of adding data to the Compendium. Toggling this on will enabled drag & drop from a character sheet to the Header drop target on the main UI. Valid drag targets should be highlighted in blue on any active character sheet. If you add any repeating section to the sheet while Sheet Thief is active, you will need to toggle it off and on again to make them valid targets.

4. Edit Item, Delete Item, New Collection
  - Each item has edit & delete buttons attached.
  - For Collection-type items, there's a "+ New" button on the table header to create a new entry

## Common controls:
These controls are common to GM and players.
![playerUI](https://user-images.githubusercontent.com/74662220/123500124-e5853a80-d67a-11eb-8a9a-cfc4fce8266d.png)

1. Category & Subtype Select:
  - Pretty self-explanatory. The currently selected options are saved per-player. If the GM changes the active Compendium, players will need to change the category to refresh the table items.

2. Search Filter:
  - Also pretty self-explanatory.

3. Flag Icon Key:
  - Mouseover this to get an explanation of the icons on the Compendium Items in the table.

4. Table Entries:
  - Drag & Drop these onto your character sheet!
  - The icons on the right indicate some detail about the item, as per the Flag Icon Key.


# The two Data Types
Custom Compendium uses two Classes of data object for storage: CCItem and CCCollection. The categories in the dropdown are split between the two types, with Collection types (such as Class & Race) indicated with a copyright symbol. Yes, I get the irony.... but font-awesome icons don't seem to work in <select> elements!

**CCItem:**
  This is the primary data type of Custom Compendium, and stores a complete Repeating Row. If you're not familiar with how these work, here's some info on the [Wiki](https://wiki.roll20.net/Repeating_Sections). Every @{attribute} for the Repeating Entry is stored in the CCItem object, with some of the redundant information stripped out (e.g. the UUIDs which need to be generated again when dropped onto a sheet). The extension also runs the Attribute Array through a few functions (pretty basic for now) to do things like set the "options_flag" attributes to '0', so the Spell/Trait is always collapsed when dropped onto a sheet.
  There is a limited editing scope for these items included in the extension - you can change the subcategory and edit the current/max Attribute values. The base Category is currently locked, as they represent the core repeating_sections on the character sheet - changing this would be unwise for most users.
  While the subcategory can be changed, it will only change the display in the Custom Compendium table. Changing the actual character sheet subcategory (for example, changing a cantrip to a Level 1 spell) requires section-specific editing of all Attribute names. While this is entirely possible to do, it's not a current priority - the idea is to get the abilities set up exactly as you want them on the Character Sheet before dropping them into the Compendium. The character sheet already does a good job of letting you edit items, and I don't see the need to replicate this.
  
**CCCollection**
  Collections (indicated by the copyright symbol in the category dropdown) are a bundle of CCItems stored together for ease of dropping multiple entries. These can be made up of any of the base CCItem data types, however they must be present in the Compendium. **IMPORTANT: CCCollection only stores link data for the Items it contains, deleting the individual Items from the Compendium will remove them from any Collections they're a part of!**
  Following from this, if you modify an individual item (for example, Fireball changes from 8d6 damage to 12d6 damage), the item will be modified for any Collection it is a part of. Again - Collections only store links to Items, not copies of the Items.
  To assist in (hopefully) not breaking your Collections accidentally, there is a flag icon on CCItems to indicate if they're part of a Collection.
  
