## [Latest Version](https://minhaskamal.github.io/DownGit/#/home?url=https://github.com/ooshhub/r20customCompendium/tree/main/customCompendium)

# Custom Compendium v0.1.0

Custom Compendium browser extension for Roll 20. Manage repeating entries with a drag & drop UI to save custom Spells, Traits, Items & Proficiencies. Organise them into Collections so you can drop custom Classes, Races, Feats and Background straight onto your character.
Very early development!

Currently supported:
  - browsers: FireFox, Chrome
  - character sheets: dnd5e by Roll20

## What this is:

A drag & drop storage facility for customised character sheet data. The purpose of this extension is to allow easy and ready access to customised Repeating Entries, and to be able to move them between Campaigns. This is a convenience storage method, and nothing more - it doesn't enable anything that can't currently be done with some tiresome copy & pasting.

## What this is not:

A real Custom Compendium. Adding the ability to mass-import/export characters, NPCs, handouts and so forth, would be infringing on the Pro-level Transmogrifier functionality, and is never going to be part of this project. The concept is to add missing functionality, not to upset Roll20. The extension also has no integration with Charactermancer or the actual Compendium. This is unlikely to ever change, for a whole bunch of reasons.

## IMPORTANT:
- As with any third-party software, be careful what you install and how you use it. While browser security is pretty solid and prevents Extensions from modifying system files in nasty ways, there are undoubtedly other ways for code to do nasty things. While I can happily say I haven't buried anything nasty in here, I'm a hobbyist and not a real coder - use of the Extension is at your own risk.
- Please do not post about this Extension on the Roll20 forums. Any bugs or issues with this Extension are not Roll20's problem: no Roll20 staff or mods contributed to this code.
- Back up your work! I'd highly recommend backing up any Campaign you're planning on using this Extension with. I'd also highly recommend keeping an up-to-date JSON of your Custom Compendium using the Export function.
- Any big changes to browser extension funtionality or Roll20 could break this Extension at any time.
- This extension stores data in the Campaign object. Any Roll20 changes to the Campaign data structure could quite possibly delete all Custom Compendium data. It also saves basic UI settings in the Player object. Logging is as another player may result in a different UI view.

## Installation
```diff
- This is currently a combined package for both FireFox and Chrome with two **manifest.json** files.
- Ensure you select the right one!
```
Download the [latest version](https://minhaskamal.github.io/DownGit/#/home?url=https://github.com/ooshhub/r20customCompendium/tree/main/customCompendium). Place in a folder somewhere on your PC. Or cloud storage. Or wherever.

**Chrome**:
  1. Enable developer mode - https://developer.chrome.com/docs/extensions/mv3/getstarted/#manifest
  2. Load the unpacked extension from the root folder \customCompendium\, cointaining CHROME MANIFEST and manifest.json
  3. If your Roll20 campaign is already loaded, you will probably need to refresh the page (F5)

**FireFox**:
  1. Navigate to about:debugging - https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/
  2. Click "load temporary addon" and navigate to \customCompendium\ff\, the folder containing FIREFOX MANIFEST and manifest.json
  3. Double-click on **manifest.json**
  4. The extension should start loading if your Roll20 campaign is open, or will load when you next open it

*While in such early development, this will continue to be a combined FF/Chrome package and need to be installed as an unpacked/temporary addon. Sorry for the inconvenience, but I'm very lazy.*

# Quick Start - Basic Use:
**Adding to the Compendium (GM Only):**
  1. Get all of your homebrew/modified content the way you want it on a character sheet, for example a sheet called "Homebrew Spells" with all of your modified spells right there on the sheet. You possibly already have this part done.
  2. Create a New Compendium, or just use the Default, and make sure it is selected.
  3. Toggle "Sheet Thief" mode, and drag the items you want from the character sheet to the drop target in the Custom Compendium UI.
  4. To create a Collection of entries (e.g. Class, Background) select the relevant category, click the "+ New" button and select a name & subcategory. Now click the Edit button next to the new entry.
  5. Toggle the "Add Item" button within the Edit Collection dialog. This enabled drag & drop from the main UI to the required tier of the Collection.

**Dropping to a Character Sheet (GM and Player):**
  1. Items: simply drag & drop the Item you want to the character sheet.
  2. Collections: drag & drop the Collection you want. You should then see a pop-up where you can select which tiers to drop: for example, if you've created a new Level 10 character with the custom class Fool, drag & drop the Fool class entry, the check the boxes for levels 1 through 10.

# The interface:
![basicUI](https://user-images.githubusercontent.com/74662220/123499294-ddc29780-d674-11eb-9e93-8e4ceb762293.png)

1. Mini Icon - this can be dragged left and right to desired position. In case the main UI somehow gets lost at sea, a double-right-click on this Icon will restore the UI to the middle of the screen with a preset height.
2. Header & Minimise Button - The frame can be dragged around by the Header. Double-click the Header to collapse the frame. Click the Minimise Button to close the main UI. Left-clicking the Mini Icon at the top of the canvas will restore the frame.

## GM controls:
These controls are GM-only and hidden from players.

![gmUI](https://user-images.githubusercontent.com/74662220/123500050-4fe9ab00-d67a-11eb-8ac0-35c1fdc124ab.png)

**1. Compendium Controls:**
  - Control the currently active Profile from the drop-down.
  - Create a new Profile or delete an existing one with the relevant buttons.
  - Items and Collections can exist under multiple Profiles if you wish.

**2. Import & Export:**
  - Export the current Profile (only the currently-selected Profile in the drop-down) as a JSON. Good for backing up your work, or trasnferring between Campaigns.
  - Import from JSON (only a JSON created by Custom Compendium) to the currently selected Compendium Profile.
  - You can use these to merge Profiles, for example:
     i) select Custom Spells Profile => export to JSON.<br>
     ii) select Custom Traits Profile => export to JSON.
     iii) create New Profile: Homebrew
     iv) select Profile: Homebrew
     v) import Custom Spells.JSON
     vi) import Custom Traits.JSON
     vii) the Homebrew profile now contains all the data from your Spells & Traits compendiums

**3. Sheet Thief Mode:**
  - This is the primary method of adding data to the Compendium. Toggling this on will enabled drag & drop from a character sheet to the Header drop target on the main UI. Valid drag targets should be highlighted in blue on any active character sheet. If you add any repeating section to the sheet while Sheet Thief is active, you will need to toggle it off and on again to make them valid targets.

**4. Edit Item, Delete Item, New Collection**
  - Each item has edit & delete buttons attached.
  - For Collection-type items, there's a "+ New" button on the table header to create a new entry

## Common controls:
These controls are common to GM and players.

![playerUI](https://user-images.githubusercontent.com/74662220/123500124-e5853a80-d67a-11eb-8a9a-cfc4fce8266d.png)

**1. Category & Subtype Select:**
  - Pretty self-explanatory. The currently selected options are saved per-player. If the GM changes the active Compendium, players will need to change the category to refresh the table items.

**2. Search Filter:**
  - Also pretty self-explanatory.

**3. Flag Icon Key:**
  - Mouseover this to get an explanation of the icons on the Compendium Items in the table.

**4. Table Entries:**
  - Drag & Drop these onto your character sheet!
  - The icons on the right indicate some detail about the item, as per the Flag Icon Key.


# The two Data Types:

Custom Compendium uses two Classes of data object for storage: CCItem and CCCollection. The categories in the dropdown are split between the two types, with Collection types (such as Class & Race) indicated with a copyright symbol. Yes, I get the irony.... but font-awesome icons don't seem to work in \<select\> elements.

**CCItem:**  

This is the primary data type of Custom Compendium, and stores a complete Repeating Row. If you're not familiar with how these work, here's some info on the [Wiki](https://wiki.roll20.net/Repeating_Sections). Every @{attribute} for the Repeating Entry is stored in the CCItem object, with some of the redundant information stripped out (e.g. the UUIDs which need to be generated again when dropped onto a sheet). The extension also runs the Attribute Array through a few functions (pretty basic for now) to do things like set the "options_flag" attributes to '0', so the Spell/Trait is always collapsed when dropped onto a sheet.
  There is a limited editing scope for these items included in the extension - you can change the subcategory and edit the current/max Attribute values. The base Category is currently locked, as they represent the core repeating_sections on the character sheet - changing this would be unwise for most users.
  While the subcategory can be changed, it will only change the display in the Custom Compendium table. Changing the actual character sheet subcategory (for example, changing a cantrip to a Level 1 spell) requires section-specific editing of all Attribute names. While this is entirely possible to do, it's not a current priority - the idea is to get the abilities set up exactly as you want them on the Character Sheet before dropping them into the Compendium. The character sheet already does a good job of letting you edit items, and I don't see the need to replicate this.

**CCCollection:**

  Collections (indicated by the copyright symbol in the category dropdown) are a bundle of CCItems stored together for ease of dropping multiple entries. These can be made up of any of the base CCItem data types, however they must be present in the Compendium. **IMPORTANT: CCCollection only stores link data for the Items it contains, deleting the individual Items from the Compendium will remove them from any Collections they're a part of!**
  Following from this, if you modify an individual item (for example, Fireball changes from 8d6 damage to 12d6 damage), the item will be modified for any Collection it is a part of. Again - Collections only store links to Items, not copies of the Items.
  To assist in (hopefully) not breaking your Collections accidentally, there is a flag icon on CCItems to indicate if they're part of a Collection.
The Collection drop UI:

![collectionDropUI](https://user-images.githubusercontent.com/74662220/123501890-4a469200-d687-11eb-9fbc-407d5232466b.png)

Click the "Add Items" toggle to enable drag & drop into the Collection tiers. Only CCItems may be dropped into a Collection - nesting Collections inside Collections is not currently possible.

# Notes on Category types and linked data:

Some Category types (linked to sheet-specific repeating_sections) can grab linked data from the sheet. This is character-sheet-specific, but the following functions are implemented for the 5e by Roll20 sheet:

**General:**
- All Items will check Handouts for an identically-named entry when added to the Custom Compendium. If one is found, it will prompt to add the linked Handout data to the entry. Linked Handouts will prompt for creation upon dropping the parent item to a new sheet, but only for the GM. Players do not have permission to add Handouts to the Campaign.
- All Items added to the Compendium will check the Resources fields for a matched name, and add the Resource counter as linked data with 'current' set to '0' and 'max' set to whatever max value is found. **Dropping this back to the sheet currently does nothing** - function for adding a repeating resource will be added soon.

**Items:**
- Inventory items added to the Custom Compendium will attempt to find a linked repeating_attack entry. This will be stored as part of the item, and repopulate when dragged to a new sheet
- Inventory items will prompt to set the quantity to '1' when added to the Compendium
- Inventory total weight should recalculate upon dropping new items
- Inventory tooltip should auto-populate for common item types

**Spells:**
- Spells added to the Custom Compendium will attempt to find a linked repeating_attack entry. This will be stored as part of the item, and repopulate when dragged to a new sheet. This *should* point to the 5e @{spellcasting_ability} Attribute, so the details should be correct regardless of spellcasting stat. However, this relies on the original Spell data being correct and not hard-coded to a specific Ability, and isn't currently checked by CC.
- Spells tooltip should auto-populate with different results for Attack and Spellcard type spells.

**Attacks:**
- Attacks dragged from the repeating_attack section should attempt to find a linked Spell or Item. If none is found, it will be added as an unlinked Attack under the "Attack" category.

**Traits:**
- Traits currently do **not** search for a linked attack. I will add this functionality in soon, for Traits like Second Wind where a linked attack (healing calculation) and resource counter (uses per rest) are desirable. The sheet doesn't directly support linking in this case, so it will be on a name-match basis like the Handout and Resource search.

**Proficiencies:**
- I've grouped both repeating sections under the same Category in this case, as they're generally the least-used sections. However the "tool" subcategory is a distinct repeating section "repeating_tool", while all other subcategories belong to the "repeating_proficiencies" repeating section - these are divided into subtypes via one of the repeating section Attributes on the character sheet. As with any other subcategory change in Custom Compendium, this will not currently change the character sheet Attribute - so changing a "weapon" proficiency to an "armor" proficiency will move it within the CC UI, but when dropped onto the sheet it will still be listed as "weapon".


**Collections:**
- Collections are a data type created for Custom Compendium and do not correspond to anything on the charater sheet. They're only distinct from each other in how they're divided into Tiers - Level 1 through 20 for character classes, and one Tier for the other types. Although the subcategory selections are currently passed through validation, this isn't strictly necessary. I might open this up in future so custom categories can be added, as it's just an internal data-handling issue and not linked to anything on the character sheet. For now, though, the categories and subcategories must be from the valid, pre-coded types.

# Bugs, issues, limitations & future plans:
## Bugs
- Full extension script injection will be attempted when a character sheet is popped out. This results in a pop-up after the 30 second timeout expires. Fix should be reasonably straight-forward.
- Any crash in the Dialog scripts will disable the button functionality. There's a fallback script outside the dialog scope, so the X close button in the top right should still destroy the frame. My limited coding ability means this will probably remain as the solution to Dialog errors, unless the fallback fails.
- Tooltip on the top-most item in the table can be cut off. This is going to require some rejigging of the HTML in a way that doesn't break the full frame layout. I've spent enough time wrestling with CSS for now, but will get to it.

## Issues
- There are a few places in the code where I've used an async timeout function to prevent errors from happening. I'll try to find better ways of awaiting Roll20 functions that don't rely on this, as long lag times could lead to errors.
- One of these places is the iframe script injection when a character sheet is opened. If you rapidly close and open character sheets, this could lead to a non-functional Sheet Thief mode. Closing and re-opening the character sheet after waiting a few seconds should fix this, if not, F5 is your friend.
- If you drag something onto a sheet, and nothing populates in the target repeating section, there's probably an error in my code. Try not to repeat the process too many times if it isn't working: it's more than likely creating a ton of Attributes on the character sheet (I think there's 37 or so in a Spell), but a fuckup on my part has led to a misnaming where the character sheet won't display it. If you keep dragging the same thing onto the sheet with no result, you're potentially adding a ton of useless Attributes which could potentially add lag to the game. I'll try to think of a clean-up function that's safe to run without destroying actual data, but for now - **please make a duplicate of a character sheet before dragging too much stuff onto it!**

## Limitations
- No Charactermancer functionality is likely to happen. This is an overwhelming, complicated ball-of-yarn of code, which looks like it'd require it's own undertaking. It's probably beyond my ability anyway. Having said that, I already have the tools coded in to allow a popup prompt to select an Ability to do a +1 or +2 bonus when dropping a Race onto a character sheet - so this limited functionality may make an appearance. However, it's very sheet-specific, and I'd need to consider an Undo function, so this won't happen any time soon. For now, you could include a Trait which reads "add +2 to Charisma" in your Custom Race, and delete the Trait after you've manually increased the Ability score.
- Definitely no Real Compendium integration of any type, ever. This is copyright-infringing territory, and would require interaction with authentication systems I don't understand.
- Core Firebase authentication is not tampered with on any level - I have no idea how to do this, nor do I have any desire to. A canny player can easily figure out how to re-enable GM view in their CC extension. They can even drag their own content into the Compendium once they've done that - however this will only modify the data represented in their own browser. Any attempt to push these data changes to Firebase will be met with angry error messages in console. The same goes for character sheet permissions: CC only allows a player to drop content onto a sheet they have FB permission to modify.

## Future plans:
- Any bug fixes required for core funcionality
- A rejigging of the customCompendium5e.js and helpers5e.js code (or, more honestly, "complete rewrite") to split the functions into generic and sheet-specific groups. I think real coders call this 'decompositioning' or something. I call it 'de-ooshing', or sometimes, 'un-potating' the code. This will make it pretty easy to add new sheets - at the moment, it's semi-hard-coded (that sounds.... all kinds of wrong) for the 5e sheet.
- A few things mentioned above (mostly simple functions for Resource sections and linked data) and potentially an interface to add/edit linked data.


# Development, and the idiot responsible

I'm pretty new to coding with no actual IT education. This much will be immediately obvious to anyone with any real ability who looks at my code.
The project started as an exercise in "I wonder if this is even possible? How does one even write a browser extension?". I didn't even know what JQuery was, exactly, when I started - this is painfully obvious in the code, with some shorthand JQ functions nestled in between wordy, vanilla JS functions operating on the same HTML elements. So... apologies in advance if you're going to read through the code, it's a mess! I'll endeavour to rewrite and restructure it before packaging properly as an extension.
The initial development of this whole project was just coming to terms with the interaction between JQ drag & drop, HTML5 drag & drop, and their interactions with each other and the way iframes work when a character sheet is opened. [Here is a behind-the-scenes video](https://www.youtube.com/watch?v=AiyJI5Kmcro) of me attempting to tame the drag & drop process. You can even see HTML5 getting involved around the 50-second mark.

I no longer use Roll20 for games, and never got involved with any Homebrew - so there's probably a bunch of improvements to usability that haven't occurred to me. I'd also be happy to handball the whole project to someone else who's more actively involved with Roll20, and a better coder. The last part probably applies to most of the population of Earth.

Anyways, if you're interesting in the code, some pointers:
  - bootstrap.js - the only extension-scope script. This can only communicate with the injected scripts via the customEvent element inserted into the page. It uses a pretty script injection method to insert the rest of the code into the browser window. Worth noting that no Roll20 code is modified or patched.
  - scripts/menu.js - the core UI HTML, JS and JQ
  - scripts/extendUI.js - Mutation Observer for sheet opening events, and extended functions for the UI - drag & drop, drawing the data table
  - scripts/classes.js - definitions for CCItem and CCCollection
  - scripts/helpers.js - all manner of Helper functions, from Roll20 stuff to HTML insertion & manipulation
  - systems/roll20_5e/customCompendium5e.js - the core data manipulation functions for moving data in & out. This is the code in most urgent need of a rewrite, and also some of the oldest code in the project. There's a bunch of stuff in here that needs to be split to another module of generic functions, and the 5e-specific parts can easily be condensed into a much more efficient module
  - systems/helpers5e.js - helper functions specific to the 5e sheet. This also needs an overhaul, mostly to be organised into a template-y kind of structure to make it easier to rewrite the functions for other character sheets
  - systems/sheetFluffer5e.js - a seperate injection inside the character sheet iframe. Anything that needs to run inside the character sheet iframe needs to be in here. Communication with the outside world is via the customEvents element.
  - utils/occCC.js - this awkwardly-named file contains the custom dialog Class and functions. It's a bit of a mess, again probably needs the generic, reusable code to be properly separated from the project-specific bits.
  - utils/FileSaver.js - external library for the Import/Export functions
  - style/cc.css - I beg you not to look in here. My CSS-fu is dreadful. Like "I just punched myself in the genitals" awful.

## Finally...

If you're interesting in contributing to the project (or even taking it over completely) let me know. As mentioned above, my CSS is even worse than my JS, so if you have some suggestions for a makeover, or even actual Stylus code to make it better, brilliant! There are some data attributes on the table entries for things like category-specific colouring, or whatever.

A massive thank you to the Roll20 Community, particularly the coders/scripters. The amazing folk there keep me haunting the Forums even though I no longer have a dog in this fight! The Community is the #1 thing I miss about using Roll20 as preferred platform, if you're not already involved on the Forums, get in there!
