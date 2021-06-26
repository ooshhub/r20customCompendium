/* globals CCH, occDialog */

const CCH5e = (() => { //eslint-disable-line no-unused-vars

    // Regex for finding the display name for each repeating section (category)
    const nameAttribute = {
        item: /itemname$/i,
        spell: /spellname$/i,
        trait: /_name$/i,
        attack: /atkname$/i,
        proficiency: /name$/i
    }

    const attrReplacers = {
        STR: /@{[^|{}]*?\|?strength[^}]*?}/ig,
        DEX: /@{[^|{}]*?\|?dexterity[^}]*?}/ig,
        CON: /@{[^|{}]*?\|?constitution[^}]*?}/ig,
        WIS: /@{[^|{}]*?\|?wisdom[^}]*?}/ig,
        INT: /@{[^|{}]*?\|?intelligence[^}]*?}/ig,
        CHA: /@{[^|{}]*?\|?charisma[^}]*?}/ig,
        PROF: /@{[^|{}]*?\|??pb[^}]*?}/ig,
    }
    const attrReplace = (inputStr) => {
        for (let r in attrReplacers) inputStr = inputStr.replace(attrReplacers[r], r);
        return inputStr.replace(/@{[^}]*?}/, 'ATTR')
    }
    const validate = {
        category: ['item', 'spell', 'trait', 'attack', 'proficiency'],
        collectionCategory: ['class', 'race', 'feat', 'background'],
        subCategory: {
            item: ['weapon', 'armor', 'equipment', 'misc'],
            spell: ['cantrip', 'level1', 'level2', 'level3', 'level4', 'level5', 'level6', 'level7', 'level8', 'level9'],
            trait: ['racial', 'class', 'feat', 'background', 'misc'],
            attack: ['unlinked attack'],
            proficiency: ['tool', 'language', 'weapon', 'armor', 'other'],
            class: ['class', 'subclass'],
            race: ['race', 'subrace'],
            feat: ['general', 'racial'],
            background: ['general']
        },
        collectionTiers: {
            class: {label: 'Level', tiers: new Array(20).fill().map((a,i) => i+1)},
            race: {label: 'Race', tiers: ["Features"]},
            feat: {label: 'Feat', tiers: ["Features"]},
            background: {label: 'Background', tiers: ["Features"]}
        },
        combinedCategories() {return this.category.concat(this.collectionCategory)},
        combinedSubCategories() {
            let output = [];
            for (let key in this.subCategory) output = output.concat(this.subCategory[key]);
            return output;
        },
        emptyObject() {
            let output = {};
            this.category.concat(this.collectionCategory).forEach(cat => {
                output[cat] = [];
            });
            for (let newCat in output) {
                this.subCategory[newCat].forEach(sc => {
                    output[newCat][sc] = [];
                });
            }
            return output;
        }
    }

    const prepareData = async (ccItem) => { // 5e-specific data changes/optimisations
        if (!ccItem) return;
        // Scrub options/details flags, so items are always folded when dropped to sheet
        let optFlags = ccItem.attrs('(options-|details-|sub)flag$', 'name', 'array');
        optFlags?.forEach(a => a.current = '0');
        // Deal with each Category
        if (ccItem.category === 'spell') {
            CCH.ccLog(`Prepare data is processing a Spell...`);
            let castingAbility = ccItem.attrs('spell_ability')?.match(/(wisdom|intelligence|charisma)/i)?.[1];
            CCH.ccLog(castingAbility, 'info');
            if (castingAbility) {
                let yesno = window.confirm(`Spell data directly references ${castingAbility} as the casting Ability for this spell. Would you like to change these references to @{spellcasting_ability} before storing? This will make the Spell suitable for different caster types.`);
                if (yesno) {
                    ccItem.data.forEach(a=>a.current.replace(/(charisma_mod|wisdom_mod|intelligence_mod)/i, 'spellcasting_ability'));
                    if (ccItem.links.attack?.length) ccItem.links.attack.forEach(a=>a.current.replace(/(charisma_mod|wisdom_mod|intelligence_mod)/i, 'spellcasting_ability'));
                }
            }
            // Any other operations to run on Spell data ?
        } else if (ccItem.category === 'item') { // Check item count, prompt to set to 1
            let qIdx;
            let qty = ccItem.data.find((a,i)=>{if (/itemcount/i.test(a.name)) {qIdx=i; return true}});
            if (parseInt(qty,10) > 1) {
                let confirm = await occDialog.yesNo('Change Quantity?', `This Inventory Item has an item count above 1. Would you like to set the saved item quantity to 1?`);
                if (confirm) {
                    qty.current = '1';
                    ccItem.data[qIdx] = qty;
                }
            }
        }
        return ccItem;
    }

    const buildFlags = async (ccItem) => { // Add more derived data here as needed by the UI
		if (!ccItem) return;
        let notes = [];
		if (ccItem.category === 'attack') {
			notes.push(`${ccItem.attrs(`atkrange`)||'Melee'} Attack`);
            notes.push(ccItem.attrs('atkdmgtype')||'No damage found')
			notes.push(cleanDamage(ccItem.data)||''); // clean up damage expression?
		} else if (ccItem.category === 'spell') {
            if (ccItem.links?.attack?.length) {
                notes.push(`${ccItem.attrs(`spellattack`)||''} ${CCH.emproper(ccItem.subCategory)||''} Spell Attack`);
                notes.push(`${ccItem.attrs('atkdmgtype')||ccItem.attrs('spelldamage$')||ccItem.attrs('spellhealing$')||'?d?'} ${ccItem.attrs('damagetype$')||''}`);
                notes.push(ccItem.attrs('castingtime')||'');
            } else {
                let conc = /=1/.test(ccItem.attrs('spellconc')||'') ? ', Concentration' : '';
                notes.push(`${ccItem.attrs('lcastingtime')||''}${conc}`);
                notes.push(`${CCH.emproper(ccItem.attrs('lschool'))}, ${ccItem.attrs('lrange')}`);
                notes.push(ccItem.attrs('lduration'));
            }
        } else if (ccItem.category === 'item') {
            let itemMods = getItemMods(ccItem.data, ['item type', 'ac', 'damage', 'damage type', 'range']);
            let itemProps = ccItem.attrs('itemproperties')|[];
            notes.push(itemMods[0]||CCH.emproper(ccItem.subCategory));
            if (ccItem.subCategory === 'weapon') {
                let dmgAttr = /finesse/i.test(itemProps) ? 'STR/DEX' : /range/i.test(itemMods[0]) ? 'DEX' : 'STR';
                notes.push(`${itemMods[2]||'?d?'} + ${dmgAttr} ${itemMods[3]||''} Damage, ${itemMods[4]||'5'}ft`);
                notes.push(itemProps||'');
            } else if (ccItem.subCategory === 'armor') {
                notes.push(`${itemMods[1]||'?'} AC`);
                if (parseFloat(ccItem.attrs('itemweight'),10) > 0) notes.push(`${ccItem.attrs('itemweight')} pds`);
            } else if (ccItem.subCategory === 'equipment') {
                if (ccItem.attrs('useasresource') == 1) notes.push('Linked Resource');
            }
        } else if (ccItem.category === 'trait') {
            notes.push(`${ccItem.attrs('source')||'General'} Trait`);
        }
        ccItem.flags.tooltip = notes||null;
        return ccItem;
	}

    // Probably redundant. Probably wrong - don't want attribute bonuses in a compendium entry
    const cleanDamage = (attributeArray) => {
        let dmgExpressions = attributeArray
            .filter(a=>/dmg\d*base/i.test(a.name) && a.current)
            .map(a=> {
                //let scaling = 0;
                let dmg = a.current||''//.replace(/(^\[\[|\]\]$)/g, '');
                let dmgOut;
                let rxCantripScale = /\[\[[^\]]*?level[^\]]*?\]\]/i
                if (rxCantripScale.test(dmg)) {
                    //scaling = 'c';
                    dmg = dmg.replace(rxCantripScale, 'CS');
                }
                dmgOut = attrReplace(dmg)
                    .replace(/(^\[\[|\]\]$)/g, '')
                    .replace(/\[\[/g, '(')
                    .replace(/\]\]/g, ')');
                    CCH.ccLog(`Damage recombobbed: `,dmgOut);
                return dmgOut;
            });
        let dmgType = attributeArray.find(a=>/_dmgtype/i.test(a.name))?.current||'damage';
        CCH.ccLog(dmgType);
        return `${dmgExpressions.join(' + ')} ${dmgType}`;
        // || /dmg\d*type/i.test(a.name)
    }

	const getItemMods = (itemAttrs, modsRequested) => {
        itemAttrs = Array.isArray(itemAttrs) ? itemAttrs : [itemAttrs];
        modsRequested = Array.isArray(modsRequested) ? modsRequested : [modsRequested];
		let itemModAttr = itemAttrs.find(a=>a.attributes?.name?.match(/itemmodifier/i))?.attributes?.current||
                            itemAttrs.find(a=>a.name?.match(/itemmodifier/i))?.current||
                            null;
        if (!itemModAttr) return CCH.ccLog(itemAttrs, 'warn', `Couldn't find Item Mods attribute`);
        let itemMods = itemModAttr.trim().split(/\s*,\s*/g);
        CCH.ccLog(`Item mods: ${itemMods}`);
		if (!itemMods?.length) return false;
		let results = [];
        modsRequested.forEach(imod => {
            let rxmod = new RegExp(`\\s*${imod}\\s*[:+-]\\s*(.+)`, 'i');
            //CCH.ccLog(rxmod);
            let reqMod = itemMods.find(mod => rxmod.test(mod));
            if (reqMod) results.push(CCH.emproper(reqMod.match(rxmod)[1].trim()));
            else results.push(null);
        });
        CCH.ccLog(results, 'info');
        return modsRequested.length > 1 ? results : results[0];
	}

    const getLinkedAttack = async (char, repeatingAttrArray, nameSearch=false) => {
		let output = null;
        let linkId;
        if (nameSearch) {
            let traitName = repeatingAttrArray.find(a=>/_name$/i.test(a.attributes.name))?.current;
            if (traitName) {
                CCH.ccLog(`Searching for repeating_attack with name ${traitName}...`);
                let atkAttr = CCH.getAttrs(char, `^${traitName}$`, 'current')
                    .find(a=>/atkname$/i.test(a.attributes.name));
                linkId = (atkAttr) ? atkAttr[0]?.attributes?.name?.match(/repeating_attack_(-[A-Za-z0-9_-]{19})/)?.[1]||null : null;
                if (linkId) {
                    CCH.ccLog(`Found linked attack with rowID: ${linkId}`);
                    output = CCH.getAttrs(char, `attack_${linkId}`);
                    return output;
                }
            }
        } else {
            linkId = repeatingAttrArray.find(a=>/attackid\s*$/.test(a.attributes.name))?.attributes?.current||null;
            if (linkId && CCH.checkID(linkId)) {
                output = CCH.getAttrs(char, `attack_${linkId}`);
                if (output) CCH.ccLog(`Linked attack found with ${output.length} entries in rep row`);
                return output;
            }
        }
		return (output?.length) ? output : null;
	}

    const getLinkedResource = async (itemName, category, char, repeatingAttrArray) => {
        let output;//-lrovotynm4njovqrcdn_resource_right
        CCH.ccLog('Looking for linked resource counter...');
        let resourceRow = repeatingAttrArray.find(a=>/resourceid/i.test(a.attributes.name))?.attributes?.current;
        if (resourceRow) {
            let resourceName = CCH.getAttrs(char, `${resourceRow}_name`, 'name', true)?.[0];
            let resourceCount = CCH.getAttrs(char, `${resourceRow}$`, 'name', true)?.[0];
            CCH.ccLog([resourceName, resourceCount], 'log', `getLinkedResource -`);
            output = {
                name: resourceName?.attributes?.current||itemName,
                current: 0,
                max: resourceCount?.attributes?.max||0,
                itemid: true
            }
        } else {
            let result = CCH.getAttrs(char, `^\\s*${itemName}\\s*$`, 'current', true)
                .find(a=>/_resource_name/i.test(a.attributes.name));
            let resMax;
            if (result) {
                resMax = CCH.getAttrs(char, `${result.attributes.name.replace(/_name$/, '')}$`, 'name', true)?.[0]?.attributes?.max||0;
                output = {
                    name: itemName,
                    current: 0,
                    max: resMax,
                    itemid: false,
                }
            } else return null;
        }
        if (output) {
            let confirm = await occDialog.yesNo(`Linked Resource`, `A resource field with the name "${itemName}" was found. Would you like to store this with the ${category}?`);
            if (!confirm) return null;
        } else CCH.ccLog(`Storing linked resource...`);
        return output;
    }

    const getSpellLevel = (char, spellRepRowAttrs) => {
        let itemSubcat = spellRepRowAttrs.find(a=>a.attributes.name.match(/spelllevel/i))?.attributes.current;
        if (itemSubcat) {
            itemSubcat = /^\d+$/.test(itemSubcat) ? `level${itemSubcat}` : itemSubcat;
            return itemSubcat;
        } else CCH.ccLog(`Couldn't find spell level the usual way. Insert backup method here`, 'warn');
    }

    const getProficiencyType = (repeatingAttrs) => {
        let result;
        if (repeatingAttrs.findIndex(a=>a.attributes.name.match(/repeating_tool/i)) > -1) result = 'tool';
        else {
            let profType = repeatingAttrs.find(a=>a.attributes.name.match(/_prof_type$/i))?.attributes.current?.toString()?.toLowerCase()||null;
            if (!profType) result = 'Language';
            if (!validate.subCategory.proficiency.includes(profType)) result = 'other';
            else result = profType;
        }
        CCH.ccLog(result, 'log', `getProficiency result`);
        return result;
    }

    return {
        nameAttribute: nameAttribute,
        getItemMods: getItemMods,
        getLinkedAttack: getLinkedAttack,
        getLinkedResource: getLinkedResource,
        getSpellLevel: getSpellLevel,
        prepareData: prepareData,
        buildFlags: buildFlags,
        getProficiencyType,
        validate: validate,
    }
    
})();