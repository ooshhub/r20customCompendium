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
