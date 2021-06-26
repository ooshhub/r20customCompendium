/* globals CCH, CCItem, CCCollection, CCH5e, CCUI, $, occDialog */

const customCompendium = (() => {  //eslint-disable-line no-unused-vars

		// CompendiumItem class constructor syntax & expected data:
		// let x = new CompendiumItem(name, type, subtype, attributes, links, flags);
		// -name, type, subtype - strings. Type & subtype must match UI options or it will not display TODO: add 'miscellaneous' tab
		// -attributes - an Array of roll20 attribute objects, {name: '', current: '', max: ''}
		// -links (OPTIONAL) - an object containing either (or both) of two keys:
		// 		{ attack: [Array of roll20 repeating_attack attributes],
		//  	  handout: {name: '', avatar: '', notes: '', tags: ''} }
		// - flags (OPTIONAL) - nothing implemented yet

	// Handle drops from Character Sheet to Custom Compendium
	// Create new Custom Compendium items from dragged data
	const handleReverseDrop = async (dropDetails) => {
		if (!window.is_gm) return alert(`Only a GM can modify a Custom Compendium.`);
		let char = Campaign.characters.get(dropDetails.characterId);
		let repeatingAttrs = CCH.getAttrs(char, dropDetails.repeatingId);
		//CCH.ccLog(repeatingAttrs);
		let itemName = repeatingAttrs.find(a=>a.attributes.name.match(/name$/))?.attributes?.current?.toString()||`Unknown ${dropDetails.category}`;
		let itemCat = /spell/i.test(dropDetails.repeatingGroup) ? 'spell' : /inventory/i.test(dropDetails.repeatingGroup) ? 'item' : /attack/i.test(dropDetails.repeatingGroup) ? 'attack' : /trait/i.test(dropDetails.repeatingGroup) ? 'trait' : /(tool|proficiencies)/.test(dropDetails.repeatingGroup) ? 'proficiency' : 'unknown';
		let handoutLink = await CCH.getLinkedHandout(itemName);
		let resourceLink = await CCH5e.getLinkedResource(itemName, itemCat, char, repeatingAttrs);
		let newItem;
		CCH.ccLog([resourceLink, handoutLink], 'info', 'Link Info - resource/handout');
		if (itemCat === 'attack') {
			// Check if repeating attack is standalone, or linked from an item or spell
			let linkDetail = CCH.getAttrs(char, `^${dropDetails.repeatingId}`, 'current')?.[0]?.attributes?.name?.match(/repeating_([^_]+?)_(-[A-Za-z0-9_-]{19})_.*attackid/)||'';
			CCH.ccLog(`link details for attack: ${linkDetail}`);
			let baseType = (/spell/.test(linkDetail?.[1])) ? 'spell' : (/inventory/.test(linkDetail?.[1])) ? 'item' : null;
			if (linkDetail && baseType) { // Attack is dervied from an Item or Spell, so process that & store as such
				let baseItemAttrs = CCH.getAttrs(char, linkDetail[2]);
				let itemSubcat = baseType === 'item' ? 'weapon' : CCH5e.getSpellLevel(char, repeatingAttrs);
				newItem = new CCItem(itemName, baseType, itemSubcat, baseItemAttrs, {attack: repeatingAttrs, handout: handoutLink||null, resource: resourceLink});
			} else { // Standalone Attack - needs category added under UI
				newItem = new CCItem(itemName, itemCat, 'all', repeatingAttrs, {handout: handoutLink||null, resource: resourceLink});
			}
		} else if (itemCat === 'item') {	// Inventory items
			// GET LINKED RESOURCE (also for trait);
			let itemType = CCH5e.getItemMods(repeatingAttrs, 'item type');
			let itemSubcat = /weapon/i.test(itemType) ? 'weapon' : /(armor|shield)/i.test(itemType) ? 'armor' : /(gear|equipm)/i.test(itemType) ? 'equipment' : 'misc';
			let attackRepAttrs = await CCH5e.getLinkedAttack(char, repeatingAttrs);
			newItem = new CCItem(itemName, itemCat, itemSubcat, repeatingAttrs, {attack: attackRepAttrs||null, handout: handoutLink||null, resource: resourceLink||null})
		} else if (itemCat === 'spell') {	// Spells
			let itemSubcat = CCH5e.getSpellLevel(char, repeatingAttrs);
			let attackRepAttrs = await CCH5e.getLinkedAttack(char, repeatingAttrs);
			newItem = new CCItem(itemName, itemCat, itemSubcat, repeatingAttrs, {attack: attackRepAttrs||null, handout: handoutLink||null, resource: resourceLink||null});
		} else if (itemCat === 'trait') {	// Traits
			//let attackRepAttrs = CCH5e.getLinkedAttack(char, repeatingAttrs, true);
			newItem = new CCItem(itemName, itemCat, 'all', repeatingAttrs, {handout: handoutLink||null, resource: resourceLink||null});
		} else if (itemCat === 'proficiency') {
			let itemSubCat = CCH5e.getProficiencyType(repeatingAttrs);
			newItem = new CCItem(itemName, itemCat, itemSubCat, repeatingAttrs, {handout: handoutLink||null});
		} else {CCH.ccLog(dropDetails, 'error', `custComp: Unknown drag type:`);return}
		if (!newItem || !newItem.data?.length) {CCH.ccLog(newItem, 'error', `custComp: new Item contains no data`); return}
		//CCH.ccLog(newItem, 'info', `Raw CCItem`);
		let newItem2 = await CCH5e.prepareData(newItem);
		CCH.ccLog(newItem2, 'info', `Prepare Data CCItem`);
		let newItem3 = await CCH5e.buildFlags(newItem2);
		CCH.ccLog(newItem3, 'info', `Flags built CCItem`);
		await CCH.saveItemToState(newItem3).then(v => {
			if (v) {
				let currentCat = CCH.settings('category');
				CCUI.refreshTable(currentCat);
			}
		});
	}

	// Handle drops from Custom Compendium to Character Sheet
	const handleSheetDrop = async (target, dragData) => {
		if (!CCH.validateDragItem(dragData)) {occDialog.alertBox('Data Error', `Drag item failed validation, see console for details`);CCH.ccLog(dragData, 'error'); return}
		let currentState = CCH.getState();
		//CCH.ccLog(currentState, 'info');
		let char = Campaign.characters.get(target);
		if (!char) {occDialog.alertBox('Roll 20 Error', `Drag item failed: Couldn't find character!`, target, dragData);return;}
		let ccItem = currentState[dragData.category]?.[dragData.subCategory]?.find(i=>i.id === dragData.id);
		if (!ccItem) {occDialog.alertBox('Data Error', `Couldn't find ${dragData.name} in ${dragData.category}/${dragData.subCategory}`); CCH.ccLog(dragData, 'error'); return}
		if (!ccItem.data && !ccItem.items) {occDialog.alertBox('Data Error', `Item ${ccItem.name} contains no valid data`); return}
		// Valid compendium Item found, pass to appropriate function
		if (/item/i.test(dragData.category)) await createInventory(char, ccItem);
		else if (/spell/i.test(dragData.category)) await createSpell(char, ccItem);
		else if (/attack/i.test(dragData.category)) await createAttack(char, ccItem);
		else if (/trait/i.test(dragData.category)) await createTrait(char, ccItem);
		else if (/proficiency/i.test(dragData.category)) await createProficiency(char, ccItem);
		else if (/(class|race|feat|background)/i.test(dragData.category)) await createCollection(target, ccItem);
		//else if (/character/i.test(dragData.category)) createCharacter(target, ccItem);
		// CHANGE THE BELOW TO GENERIC 'CREATE LINKED ITEM' FUNCTION THAT FEEDS BACK INTO
		// GENERIC CREATE REPEATING ENTRY FUNCTION
		// Handout needs to stay separate due to blobs
		if (ccItem.links?.handout?.name && window.is_gm||false) {
			let confirmHandout = await occDialog.yesNo(`Handout Found`, `A handout is stored with this entry. Would you like to import it to Journal?`);
			if (confirmHandout) createLinkedHandout(ccItem.links.handout);
		}
		if (ccItem.links?.resource?.name) {
			let confirmHandout = await occDialog.yesNo(`Resource Counter Found`, `A resource counter is stored with this entry. Would you like to import it to Journal?`);
			if (confirmHandout) createLinkedResource(ccItem.links.resource);
		}
		$('body .ui-draggable-dragging').remove();
	}

	// Create repeating entry on sheet from CC data.
	// Spell/Item attack linking is 5e specific
	// MOVE TO TWO SEPARATE FUNCTIONS, REPEATING_ENTRY AS HELPER AND LINKED ATTACK AS GENERIC LINK FUNCTION
	const createRepeatingEntry = (targetCharacter, rowAttrArray, attackAttrArray) => {
		const rxId = /_(-[A-Za-z0-9-]{19}|\$rID\$)_/;
		let attrs = targetCharacter.attribs;
		let charId = targetCharacter.id;
		let repRowID = CCH.generateRowId();
		rowAttrArray.forEach(a=> {
			let newName = a.name.replace(rxId, `_${repRowID}_`);
			//CCH.ccLog(newName, 'info', 'New attr name');
			attrs.create({name: newName, current: a.current||'', max: a.max||''})
		});
		if (attackAttrArray?.length) {
			CCH.ccLog([attackAttrArray], 'log',`Found linked attack, processing...`);
			let attackRowID = `${CCH.generateRowId()}`;
			// This part is sheef-specific, finding the cross-repeating-section link attributes
			attackAttrArray.forEach(a=>{
				if (/(spell|item)id/i.test(a.name)) attrs.create({name: `${a.name.replace(rxId, `_${attackRowID}_`)}`, current: repRowID, max: a.max||''});
				else attrs.create({name: `${a.name.replace(rxId, `_${attackRowID}_`)}`, current: a.current||'', max: a.max||''});
			});
			let rxLinkAttr = new RegExp(`${repRowID}.+attackid`);
			attrs.models.find(a=>rxLinkAttr.test(a.attributes.name))?.set('current', attackRowID);
			let rxSpellLinkAttr = new RegExp(`${repRowID}.+rollcontent`);
			attrs.models.find(a=>rxSpellLinkAttr.test(a.attributes.name))?.set('current', `%{${charId}|repeating_attack_${attackRowID}_attack}`);
			//%{-Mc1jRocfHrFv2zRhOk3|repeating_attack_-Mc1jfPorGP8vJusU-eo_attack}
			CCH.ccLog(`Created linked Attack entry`);
		}
		return repRowID;
	}

	// Create a handout in the Campaign if saved as a link. Should be generic
	const createLinkedHandout = async (handoutData) => { //eslint-disable-line
		if (!handoutData?.name) {alert(`Error: bad linked handout data`); CCH.ccLog(handoutData, 'error'); return}
		CCH.ccLog(`Attempting to create linked handout...`);
		let newHandout = Campaign.handouts.create({name: handoutData.name, avatar: handoutData.avatar, tags: handoutData.tags});
		newHandout.updateBlobs({notes: handoutData.notes||'', gmnotes: handoutData.gmNotes||''});
		return true;
	}

	// COMBINE THIS WITH CREATE LINKED ATTACK, MAKE GENERIC
	const createLinkedResource = async (linkedData) => {
		CCH.ccLog(linkedData, 'info', `Attempting to create linked resource...`);
	}

	const createInventory = async (targetCharacter, item) => {
		let linkedAttackData = (item.links?.attack?.length) ? item.links.attack : null;
		let rowId = await new Promise((res) => {
			let row = createRepeatingEntry(targetCharacter, item.data, linkedAttackData);
			res(row);
		});
		// Trigger the recalculation of the inventory weight with some trickery
		await CCH.timeout(300);
		//CCH.ccLog(rowId, 'info', `Promise returned`);
		if (rowId) {
			CCH.fakeTrigger(targetCharacter.id, `[data-reprowid="${rowId}"] .equipped.main`, [`click`,'click']);
		}
		return rowId;
	}

	const createSpell = async (targetCharacter, item) => {
		let linkedAttackData = (item.links?.attack?.length) ? item.links.attack : null;
		createRepeatingEntry(targetCharacter, item.data, linkedAttackData);
	}

	const createAttack = async (targetCharacter, item) => {
		createRepeatingEntry(targetCharacter, item.data);
	}

	const createTrait = async (targetCharacter, item) => {
		createRepeatingEntry(targetCharacter, item.data);
	}

	const createProficiency = async (targetCharacter, item) => {
		createRepeatingEntry(targetCharacter, item.data);
	}

	// Populate a dragged Collection item on the character sheet. Should be a generic function
	const createCollection = async (targetID, item) => {
		let tiers = await occDialog.dropCollectionDialog(item)||[];
		let tiername = item.tierName;
		CCH.ccLog(tiers, 'log', `${tiers.length}x ${tiername}s selected`);
		let links = item.items;
		if (!links) return CCH.ccLog(`Nothing to drop!`, 'warn');
		CCH.ccLog(links, 'log', 'Drop item log');
		if (!tiers.length) return occDialog.alertBox('Data Error', `No tiers selected.`);
		let filtered = links.filter(l => tiers.includes(l[tiername]));
		CCH.ccLog(filtered, 'info', 'Filtered List');
		await Promise.all(filtered.map(async (l) => {
			let dropData = {
				id: l.linkId,
				name: l.name,
				category: l.category,
				subCategory: l.subCategory
			}
			CCH.ccLog(dropData, 'info', 'Process Item');
			handleSheetDrop(targetID, dropData);
			//await CCH.timeout(10);
		}));
	}

	// Should be generic => move out of sheet specific script
	// Create new Collection item
	const newCollection = async (name, category) => {
		let outputCollection;
		CCH.ccLog([name, category], 'info', `Passed through to newCollection function`);
		let dropdownArray = CCH5e.validate.subCategory[category]?.map(sc => [CCH.emproper(sc), sc])||[];
		if (!dropdownArray.length || !CCH5e.validate.collectionTiers[category]) {
			occDialog.alertBox(`Collection Error`, `Could not create Collection: see console for error details.`, 'error');
			CCH.ccLog(category, 'error', `Collection creation error`);
			return;
		}
		let subCatHTML = await occDialog.dropdownSelect(`${CCH.emproper(category)} Type`, 'Select subcategory:', dropdownArray);
		outputCollection = new CCCollection(name, category, subCatHTML, CCH5e.validate.collectionTiers[category]?.label, CCH5e.validate.collectionTiers[category]?.tiers, null);
		return outputCollection;
	}


	return {
		handleReverseDrop,
		handleSheetDrop,
		newCollection,
	}

})();