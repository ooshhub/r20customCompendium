/* globals occDialog, CCH5e, CCUI, $*/
/* eslint-disable no-unused-vars */

const CCH = (() => {

    const rx = {
        r20Id: /-[A-Za-z0-9_-]{19}/,
        r20rowId: /_-[A-Za-z0-9-]{19}_/,
        ccId: /C[A-Za-z0-9_-]{19}/
    }

    const ver = {
        M: 0,
        m: 1,
        p: 0,
        schema: 0.3,
        minSchema: 0.2,
        getVer: () => {return `${ver.M}.${ver.m}.${ver.p}`}
    }

    const config = {
        keys: {
            ccState: 'customCompendium',
            settings: {
                ccSettings: 'customCompendiumSettings',
                campaign: {
                    compendium: `#oosh-cc-select-data`,
                    allowPlayers: null,
                },
                user: {
                    minimised: null,
                    category: '#oosh-cc-category-select',
                    subCategory: '.categories .oosh-cc.toolbar.data-select.subcategory',
                    position: null,
                    positionMini: null,
                    frameHeight: null,
                }
            }
        },
    }

    const consoleStyle = {
        scriptName: 'oCC',
        log: `border: solid 1px cyan; line-height: 16px; text-align: center; padding: 1px 8px 2px 8px; border-radius: 8px; background-color: #333`,
        info: `border: solid 2px orange; line-height: 16px; text-align: middle; padding: 1px 8px 2px 8px; border-radius: 8px; background-color: #444`,
        warn: `border: solid 2px red; line-height: 16px; text-align: middle; padding: 1px 8px 2px 8px; border-radius: 8px; background-color: #444`,
        error: `border: solid 2px red; line-height: 16px; color: red; font-weight: bold; text-align: middle; padding: 1px 8px 2px 8px; border-radius: 8px; background-color: #fff`
    }

    const ccLog = (msgs, style='log', title) => {
        msgs = toArray(msgs)||[];
        style = Object.keys(consoleStyle).includes(style) ? style : 'log';
        console.log(`%c${consoleStyle.scriptName}.${style}${title ? ` -= ${title} =-` : ''}`, consoleStyle[style], ...msgs);
        if (style === 'error') console.trace();
    }

    const checkID = (id) => { // Check if string is a Roll20 UUID
        const rxId = /^-[A-Za-z0-9_-]{19}$/
        if (typeof(id) == 'string') return rxId.test(id);
    }

    const checkCCID = (id) => { // Check if a string is an OCC UUID
        const rxCid = /^C[A-Za-z0-9_-]{19}$/
        if (typeof(id) == 'string') return rxCid.test(id);
        else return false;
    }

    const generateCCID = () => { // Generate an OCC UUID
        let newId = window.generateUUID();
        newId = newId.replace(/^-/, 'C');
        ccLog(newId);
        return newId;
    }

    const generateRowId = () => {
        let chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        return window.generateUUID().replace(/_/g, () => chars.charAt(Math.floor(Math.random()*62)));
    }

    // Ensure dragged item has valid types
    const validateDragItem = (dragData) => { 
        ccLog(dragData, 'log', 'passed through to validation');
        let categories = CCH5e.validate.category.concat(CCH5e.validate.collectionCategory);
        if (checkCCID(dragData.id)) {
            //console.log('passed ID check');
            if (categories.includes(dragData.category)) {
                //console.log(`passed cat check`);
                if (CCH5e.validate.subCategory[dragData.category].includes(dragData.subCategory)) {
                    //console.log(`passed subcat check`);
                    return true;
                }
            }
        }
        else return false;
    }

    // Ensure item has valid data before adding to Compendium
    const validateNewItem = (ccItem) => {
        for (let key in ccItem) {
            if (ccItem[key] === undefined) {alert(`New compendium item failed validation, see console`); ccLog(ccItem, 'error'); return false}
            if (key === 'links' || key === 'flags') {
                for (let sk in ccItem[key]) {
                    if (ccItem[key][sk] === undefined || (key === 'links' && typeof(ccItem[key][sk]) !== 'object')) {
                        let errData = ccItem[key][sk];
                        delete ccItem[key][sk];
                        alert(`"${sk}" ${key} data failed validation and was removed. See console.`);
                        ccLog(errData, 'error');
                    }
                }
            }
        }
        let combinedCategories = CCH5e.validate.category.concat(CCH5e.validate.collectionCategory);
        ccItem.category = (combinedCategories.includes(ccItem.category)) ? ccItem.category : 'misc';
        ccItem.subCategory = Object.keys(CCH5e.validate.subCategory).includes(ccItem.category) ? (CCH5e.validate.subCategory[ccItem.category].includes(ccItem.subCategory)) ? ccItem.subCategory : 'misc' : 'none';
        return true;
    }

    // Validate an item stored as a Collection entry
    const validateCollectionItem = (ccItem) => {
        let passFirst = validateDragItem(ccItem);
        let passSecond;
        if (passFirst) {
            ccLog('Second validation...');
            let currentState = getState();
            passSecond = currentState[ccItem.category][ccItem.subCategory].findIndex(i => i.id === ccItem.linkId);
        }
        return (passSecond > -1) ? true : false;
    }

    // Tidy up data strings for display
    const emproper = (inputString) => { 
        if (typeof(inputString) !== 'string') return inputString;
        return inputString.trim()
            .split(/\s+/).map(w=>`${w[0].toUpperCase()}${w.slice(1)}`)
            .join(' ')
            .replace(/([lL])(\d+)/, `$1 $2`)
            .replace(/_/g, ' ');
    }

    // Retrieve current Compendium object from Campaign. Defaults to currently selected profile
    const getState = (profile=settings('compendium')||'default') => {
        return Campaign?.attributes?.[config.keys.ccState]?.[profile];
    }

    // Update Campaign state with any changes. Defaults to main compendium storage
    // Defaults to updating the currently active Profile. To update the root object (ALL profiles), provide 'root' as 2nd parameter
    // Third parameter may be modified to update other objects
    // Returns success/failure boolean
    const updateState = (updateData, updateProfile, targetObject=config.keys.ccState) => {
        updateProfile = (/root/i.test(updateProfile) || Object.keys(Campaign.get(targetObject)).includes(updateProfile)) ? updateProfile : settings('compendium')||'default';
        let updateObj = (updateProfile === 'root') ? updateData : {[updateProfile]: updateData};
        let oldState = Campaign?.get(targetObject)||{};
        let newState = Object.assign(oldState, updateObj);
        if (!newState || typeof(newState) !== 'object') return CCH.ccLog(updateObj, 'warn', `error updating state from: -`);
        try{Campaign.save(targetObject, newState)}
        catch(err){
            ccLog(err, 'error');
            return false
        }
        return true;
    }

    const saveState = () => {
        Campaign.save(config.keys.ccState, Campaign.get(config.keys.ccState));
        ccLog('', 'log', `Campaign state saved`);
    }

    // Provide itemData as an object (either CCItem Class or simple), {id: '', category: '', subCategory: ''}, ID REQUIRED
    const getItemFromState = (itemData={}, clone=true) => {
        let currentState = getState();
        if (!checkCCID(itemData.id) || !currentState) return occDialog(`Error`, 'error', `Bad ID "${itemData.id}" or couldn't get State object!`);
        let targetObject=null;
        if (!CCH5e.validate.combinedCategories().includes(itemData.category)) { // Long search, ID only
            CCH5e.validate.combinedCategories().map(cat => {
                CCH5e.validate.subCategory[cat].map(subCat => {
                    currentState[cat][subCat].map(i => {
                        if (i.id === itemData.id) targetObject = cloneObj(i);
                        CCH.ccLog(targetObject, 'info', `getItem Long Search`);
                    });
                });
            });
        } else if (!CCH5e.validate.combinedSubCategories().includes(itemData.subCategory)) { // Mid search, no SubCat
            CCH5e.validate.subCategory[itemData.category].map(subcat => {
                currentState[itemData.category][subcat].map(i => {
                    if (i.id === itemData.id) targetObject = cloneObj(i);
                    CCH.ccLog(targetObject, 'info', `getItem Mid Search`);
                });
            });
        } else {
            currentState[itemData.category][itemData.subCategory].map(i => { // Short search, cat & subcat valid
                if (i.id === itemData.id) targetObject = cloneObj(i);
                CCH.ccLog(targetObject, 'info', `getItem Mid Search`);
            });
        }
        return targetObject;
    }

    // Saves a Compendium item to state. Returns success/failure boolean.
    const saveItemToState = async (ccItem, overwrite=false) => {
        if (!validateNewItem(ccItem)) {ccLog(`Item failed validation and was not created`, 'error'); return}
        //if (ccItem.items) {saveCollectionToState(ccItem);return} // Handball off to Collections function if collection
        let currentState = getState();
        ccLog(currentState, 'info', `Got current state`);
        if (!Object.keys(currentState).includes(ccItem.category)) currentState[ccItem.category] = {};
        if (!Object.keys(currentState[ccItem.category]).includes(ccItem.subCategory)) currentState[ccItem.category][ccItem.subCategory] = [];
        // Check if CCID already exists
        let oldItem = currentState[ccItem.category][ccItem.subCategory].findIndex(i => i.id === ccItem.id);
        let dupeItem = currentState[ccItem.category][ccItem.subCategory].findIndex(i => i.name === ccItem.name);
        let confirm;
        if (oldItem > -1 || dupeItem > -1) {
            if (!overwrite) confirm = await occDialog.yesNo('Overwrite Entry', `Would you like to overwrite the existing entry for ${ccItem.name||'this item'}?`, ['','']);
            if (!confirm && !overwrite) return false;
            else await currentState[ccItem.category][ccItem.subCategory].splice(oldItem, 1);
        }
        await timeout(0);
        currentState[ccItem.category][ccItem.subCategory].push(ccItem);
        ccLog(ccItem, 'info', `Pushed new item to ${ccItem.category}/${ccItem.subCategory}`);
        saveState();
        return true;
    }

    const deleteItemFromState = async (targetItem, noPrompt) => {
        let newState = getState();
        ccLog(targetItem, 'warn', `Item queued for removal`);
        let i = newState[targetItem.category]?.[targetItem.subCategory]?.findIndex(item=>item.id===targetItem.id);
        //ccLog(i);
        if (!(i>-1)) { // Try deleting by name if no ID found or ID corrupt
            let confirm = await occDialog.yesNo(`Delete Item`, `Missing or corrupt ID. Delete Item "${targetItem.name}"?\nOnly click yes if you are sure there are no duplicate names.`);
            if (!confirm) return false;
            i = newState[targetItem.category]?.[targetItem.subCategory]?.findIndex(item=>item.name===targetItem.name);
            if (!(i>-1)) {
                await occDialog.alertBox(`Failed deleting item`, `Cannot delete Item - item name not found`).then(() => {
                    ccLog(targetItem, 'error');
                    return;
                });
            }
        }
        try{newState[targetItem.category][targetItem.subCategory].splice(i,1)}
        catch(err){alert(`Error deleting entry, see console for details.`); ccLog(targetItem, 'error'); return}
        if (updateState(newState)) return true;
        else return false;
    }

    // Provide item as simple object with id/cat/subcat, or as CCItem Class
    // Can provide multiple values as Array to push to flag
    const editItemFlags = (item={}, flag, value, pushToArray=false, deleteFlag=false) => {
        if (typeof(item) !== 'object' || !item.id) return console.error(item, 'error', `Bad item provided to editItemFlags()`);
        let targetClone = getItemFromState(item);
        if (!targetClone) return console.error(item, 'error', `Item not found in database`);
        if (!targetClone.flags) targetClone.flags = {};
        if (pushToArray) {
            if (deleteFlag) {
                let idx = targetClone.flags?.[flag]?.findIndex(f => f == value);
                if (idx) targetClone.flags[flag].splice(idx, 1);
            } else {
                if (!targetClone.flags[flag]) targetClone.flags[flag] = [];
                value = toArray(value);
                value.map(v=>targetClone.flags[flag].push(v));
            }
        } else {
            if (deleteFlag) delete targetClone.flags[flag];            
            else targetClone.flags[flag] = value;
        }
        ccLog(targetClone, 'info', `Flags updated in object`);
        saveItemToState(targetClone, true);
    }

    const saveCollectionToState = async (ccCollection, overwrite=false) => {
        CCH.ccLog(`Successfully passed through`, 'info', `saveCollection passthrough`);
    }

    // Check Collection for non-existent items. Returns an Array with the repaired CC object, and an Array of failures
    const verifyCollectionItems = (collection) => {
        if (!collection.items || !collection.items.length) return [collection, []];
        ccLog(collection, 'log', `Verifying collection items...`);
        let changes = false;
        let passed = [], failed = [];
        collection.items.forEach((l, i) => {
            let valid = validateCollectionItem(l);
            if (!valid) {
                ccLog(l, 'warn', 'Item failed Collection validation');
                changes = true;
                failed.push(l);
            } else {
                passed.push(l);
            }
        });
        if (changes) collection.items = passed;
        return [collection, failed];
    }

    const importStateFromFile = async (json) => {
        let schemaVer = json.meta.schema_version;
        if (!schemaVer) return alert(`Incompatible JSON - only Custom Compendium exports are supported.`)
        if (schemaVer < ver.minSchema) {
            let proceed = await occDialog.yesNo(`Importer`, `Old version schema detected - import may have data missing. Proceed anyway?`);
            if (!proceed) return;
        }
        let importObj = json.data;
        let currentObj = cloneObj(getState());
        let overwrite = await occDialog.yesNo(`Importer`, `Would you like to overwrite existing entries (click cancel for 'No')`);
        mergeCompendiums(currentObj, importObj, overwrite);
    }

    const mergeCompendiums = (mainState, importState, overwrite=false) => {
        ccLog(`Merging compendium objects...`);
        let counter = {processed: 0, skipped: 0, new: 0, overwritten: 0}
        CCH5e.validate.category.forEach(cat => {
            CCH5e.validate.subCategory[cat].forEach(subCat => {
                let existingIds = mainState?.[cat]?.[subCat]?.map(i=>i.id)||[];
                ccLog(existingIds, 'info', `Importing ${cat} / ${subCat}`);
                let currentArray = importState?.[cat]?.[subCat]||[];
                if (!currentArray?.length) ccLog(`Could not find /${cat}/${subCat} entries in imported JSON`, 'warn');
                else currentArray.forEach(item => {
                    counter.processed ++;
                    let retryNormalWrite = false;
                    if (existingIds.includes(item.id)) {
                        if (overwrite) {
                            let writeIdx = mainState[cat]?.[subCat]?.findIndex(i=>i.id === item.id)||null;
                            if (writeIdx > -1) {
                                mainState[cat][subCat].splice(writeIdx, 1, item);
                                ccLog(`custComp entry "${item.name}" overwritten at ${cat}/${subCat}/#${writeIdx}`);
                                counter.overwritten ++;
                            } else retryNormalWrite = true;
                        } else counter.skipped ++;
                    }
                    if (retryNormalWrite || !existingIds?.includes(item.id)) {
                        if (!mainState[cat]) mainState[cat] = {};
                        if (!mainState[cat][subCat]) mainState[cat][subCat] = [];                            
                        mainState[cat][subCat].push(item);
                        ccLog(`new custComp entry "${item.name}" imported to ${cat}/${subCat}/`);
                        counter.new ++;
                    }
                });
            });
        });
        occDialog.alertBox(`Import Completed.`, `${counter.processed} entries processed.\n\n${counter.new} new items imported.\n${counter.overwritten} items overwritten.\n${counter.skipped} items skipped.`)
        updateState(mainState);
        CCUI.refreshTable();
    }

    // Get & set customComp settings. If no new value supplied, returns current value
    const settings = (setting, newValue=null) => {
        const campaignKeys = Object.keys(config.keys.settings.campaign);
        const userKeys = Object.keys(config.keys.settings.user);
        let returnVal;
        let target = campaignKeys.includes(setting) ? window.Campaign : window.currentPlayer;
        if (newValue && target === window.Campaign && !window.is_gm) return ccLog('Only the GM can modify Campagin settings', 'warn', `Settings`);
        let currentSettings = target.get(config.keys.settings.ccSettings);
        //ccLog(currentSettings, 'info', `Settings retrieved:`);
        if (newValue === undefined || newValue === null) returnVal = currentSettings[setting]||null;
        else try {            
            currentSettings[setting] = newValue;
            if (target === window.currentPlayer && !userKeys.includes(setting)) occDialog.alertBox(`Settings Updated`, `"${setting}" key does not exist. New setting created.`, 'info');
            returnVal = newValue;
            target.save(config.keys.settings.ccSettings, currentSettings);
            ccLog(`${setting}: ${returnVal}`, 'log', `Setting Updated`);
        } catch(err) {
            ccLog(err, 'error', `Settings Update`);
            returnVal = false;
        }
        //ccLog(`${setting}: ${returnVal}`, 'log', `Setting ${newValue ? 'Updated' : 'Retrieved'}`);
        return returnVal;
    }

    const getAttrs = (charInp, string, key='name', caseIns=false) => {
        caseIns = caseIns ? 'i' : '';
        let rx = new RegExp(`${string}`, caseIns);
        let char = (typeof(charInp) === 'object') ? charInp : Campaign.characters.get(charInp);
        if (!char) {CCH.ccLog(`custComp - bad charID or char object supplied`, 'error'); return}
        return char.attribs.filter(a=>a.attributes[key]?.toString().match(rx))||[];
    }

    const getLinkedHandout = async (itemName) => {
        let rxName = new RegExp(`^\\s*${itemName}\\s*$`, 'i');
        let handout = Campaign.handouts.models.find(h=>rxName.test(h.attributes.name));
        if (handout) {
            let confirm = await occDialog.yesNo('Handout Found', `Found a handout with the name "${itemName}". Would you like to link this to the Compendium item?`);
            if (!confirm) return null;
            let notesBlob, gmNotesBlob;
            notesBlob = await getBlob(handout, 'notes').then(v=>v);
            //ccLog(notesBlob);
            gmNotesBlob = await getBlob(handout, 'gmnotes').then(v=>v);
            //(gmNotesBlob);
            //ccLog(`Got notesBlob: ${notesBlob}`, 'info');
            let data = {
                name: handout.attributes.name,
                avatar: handout.attributes.avatar,
                notes: notesBlob,
                gmNotes: gmNotesBlob,
                tags: handout.attributes.tags
            }
            return data;
        } else return null;
    }

    const getBlob = async (handout, blobName) => {
        return new Promise(res => {
            let blobProm;
            handout._getLatestBlob(blobName, (v) => {
                res(v);
            });
        });
    }

    // Trigger something on a character sheet with jq .trigger()
    // Provide events as an Array for multiple triggers (e.g. on/off)
    // Supply any event data objects as matching single/array
    const fakeTrigger = (characterId, jqSelector, events=[], data=[]) => {
        if (!checkID(characterId)) return occDialog.alertBox(characterId, `error`, 'Bad Character ID supplied to fakeTrigger()', );
        let charFrame;
        let result = 0;
        $('iframe').each((i,el) => {
            let rxNewguy = new RegExp(characterId);
            if ($(el).attr('name').match(rxNewguy)) charFrame = el.contentDocument;
        });
        if (!charFrame) return ccLog($('iframe'), 'error', `Character frame not found`);
        let targetElement = $(charFrame).find(jqSelector);
        if (!targetElement?.length) return ccLog(charFrame, 'error', `"${jqSelector}" not found for fakeTrigger event`);
        events = toArray(events), data = toArray(data);
        events.forEach((ev, i) => {
            let evData = data[i]||data[0]||null;
            $(targetElement).trigger(`${ev}`, evData);
            ccLog(targetElement, 'info', `Triggered '${ev}' event`);
            result++;
        });
        return result;
    }

    // Other functions

    // Async timeout
    const timeout = async (ms=1000) => {
        return new Promise((res) => {
            setTimeout(() => res(), ms);
        });
    }
    // Async interval, supply a function as a condition, e.g. () => myVar === 3, leave retries blank for infinite
    const asyncInterval = async (condition, ms=1000, retries, showTicks) => {
        ccLog(`Starting interval checks...`, 'log', `asyncInterval`);
        let i = (retries > 0) ? 0 : null;
        let result = await new Promise((res, rej) => {
            let promiseInt = setInterval(() => {
                if (condition()===true) {
                    res(true);
                    clearInterval(promiseInt);
                } else if (retries===i) {
                    rej(`Timer expired`);
                    clearInterval(promiseInt);
                } else {
                    i = i > -1 ? i + 1 : null;
                    if (showTicks) console.log(`asyncInterval: tick ${i+1}`);
                }
            }, ms);
        }).catch(err => console.log(err));
        return await result;
    }

    const toArray = (inp) => {if (inp) return Array.isArray(inp) ? inp : [inp]}

    const cloneObj = (inputObj) => {
        let outputObj = false;
        if (typeof(inputObj) === 'object') {
            try {outputObj = JSON.parse(JSON.stringify(inputObj))} 
            catch {ccLog('Invalid object to clone', 'error', 'Clone Object')}
        }
        return outputObj;
    }

    const insertHTMLfromString = (string, targetElement=document.body, insertBeforeElement) => {
        let frameTemplate = document.createElement('template');
        frameTemplate.innerHTML = string;
        let frame = frameTemplate.content;
        if (insertBeforeElement) targetElement.insertBefore(frame, insertBeforeElement);
        else targetElement.appendChild(frame);
    }

    // Draggable frame function, provide element/JQ selector for target & handle + options
    const dragElement = (dragTarget, dragHandle, options={}) => {
        let dragOptions = {
            saveSetting: options.saveSetting||null, // key name to save position under
            axes: options.axes||[1,1], // X,Y controls: 0 - no drag, 1 - top/left bound drag, 2- bottom/right bound drag
            boundingElement: options.boundingElement||document.documentElement,
            boundingMinMax: options.boundingMinMax||[0,0,0,0], // Manual pixel offsets relative to bounding element
            mouseButtons: options.mouseButtons||[1,2,3] // mouse buttons to allow for drag
        }
        let posXi = 0, posXf = 0, posYi = 0, posYf = 0;
        let minX, minY, maxX, maxY;
        //let targetWidth = $(dragTarget).prop('clientWidth'), targetHeight = $(dragTarget).prop('clientHeight');
        let boundWidth, boundHeight;
        let finalLTRB = [null,null,null,null]; // left, top, right, bottom

        const getBounds = () => {
            boundWidth = $(dragOptions.boundingElement).prop('clientWidth');
            boundHeight = $(dragOptions.boundingElement).prop('clientHeight');
            minX = (dragOptions.axes[0] === 1) ? dragOptions.boundingMinMax[0] : (0 - dragOptions.boundingMinMax[2]);
            minY = (dragOptions.axes[1] === 1) ? dragOptions.boundingMinMax[1] : (0 - dragOptions.boundingMinMax[3]);
            maxX = (dragOptions.axes[0] === 1) ? boundWidth + dragOptions.boundingMinMax[2] : (boundWidth - dragOptions.boundingMinMax[0]);
            maxY = (dragOptions.axes[1] === 1) ? boundHeight + dragOptions.boundingMinMax[3] : (boundHeight - dragOptions.boundingMinMax[1]);
        }
    
        const elementGrab = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            getBounds();
            //ccLog([minX, minY, maxX, maxY], 'info', `LTRB minMax for Drag function`);
            posXi = ev.clientX;
            posYi = ev.clientY;
            $(document).on('mouseup', elementRelease);
            $(document).on('mousemove', elementDrag);
        }
    
        const elementDrag = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            $(dragTarget).data('dragging', true);
            posXf = posXi - ev.clientX;
            posYf = posYi - ev.clientY;
            posXi = ev.clientX;
            posYi = ev.clientY;

            //ccLog(`${boundWidth} - ${dragTarget.getBoundingClientRect().right} + ${posXf}`);

            if (dragOptions.axes[0] === 1) finalLTRB[0] = `${Math.min(Math.max(($(dragTarget).prop('offsetLeft') - posXf), minX), maxX)}px`;
            else if (dragOptions.axes[0] === 2) finalLTRB[2] = `${Math.min(Math.max((boundWidth - $(dragTarget)[0].getBoundingClientRect().right + posXf), minX), maxX)}px`;
            else finalLTRB[0] = `${$(dragTarget).prop('offsetLeft')}px`;
            if (dragOptions.axes[1] === 1) finalLTRB[1] = `${Math.min(Math.max(($(dragTarget).prop('offsetTop') - posYf), minY), maxY)}px`;
            else if (dragOptions.axes[1] === 2) finalLTRB[3] = `${Math.min(Math.max((boundHeight - $(dragTarget)[0].getBoundingClientRect().bottom + posYf), minY), maxY)}px`;
            else finalLTRB[1] = `${$(dragTarget).prop('offsetTop')}px`;

            //console.log(finalLTRB);
            $(dragTarget).css({left: finalLTRB[0], top: finalLTRB[1], right: finalLTRB[2], bottom: finalLTRB[3]});
        }
    
        const elementRelease = () => {
            $(document).off('mouseup', elementRelease);
            $(document).off('mousemove', elementDrag);
            // Custom save settings code, remove for general use
            if (dragOptions.saveSetting) {
                //let currentPos = [$(dragTarget).css('top')||'100px', $(dragTarget).css('left')||'500px'];
                CCH.ccLog(finalLTRB, 'log', `LTRB drag values`);
                if (finalLTRB.filter(c=>c)?.length === 2) {
                    settings(dragOptions.saveSetting, finalLTRB.filter(c=>c));
                    // temporary hard-code to save frameHeight... find a better place for this, or a Resize Observer
                    settings('frameHeight', $('#oosh-cc-frame').prop('clientHeight')||500);
                }
            }
            setTimeout(() => {
                $(dragTarget).data('dragging', false);
            }, 500);
        }
        let target = (dragHandle) ? dragHandle : dragTarget;
        $(target).on('mousedown', (ev) => {if (dragOptions.mouseButtons.includes(ev.which)) elementGrab(ev)});
    }

    const escapeRegex = (string) => {
        return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    const checkGameSystem = async (ccSetting) => {
        const systems = {
            roll20_5e: {
                compendium: 'dnd5e',
                html: `{{query=1}} {{advantage=1}}`,
            }
        }
        // Compendium test, auto-pass if not applicable
        let passCompTest, passHtmlTest, passAttrTest, sheetData;
        if (!systems[ccSetting].compendium) passCompTest = true;
        else await getCharsheetDataFB().then(csd => {
            sheetData = csd;
            if (csd.compendium !== systems[ccSetting].compendium) passCompTest = false;
            else passCompTest = true;
        });
        if (!passCompTest) {
            ccLog(`Failed Compendium test: "${sheetData.compendium}" Compendium in use.`, 'warn', `gameSystemCheck`);
            return false;
        }
        // HTML test next, auto-pass if not applicable
        if (sheetData.html) {
            sheetData = await decodeCharsheetData(sheetData);
            //ccLog(sheetData, 'info', `Decoded sheet fallback data`);
            let rxHtml = new RegExp(`${escapeRegex(systems[ccSetting].html)}`);
            if (rxHtml.test(sheetData.html)) passHtmlTest = true;
        } else passHtmlTest = true;
        if (!passHtmlTest) {
            ccLog(`Failed HTML test`, 'warn', `gameSystemCheck`);
            return false;
        }
        // Attributes test last, auto pass if not applicable
        let checks = Object.entries(systems[ccSetting]).filter(e=>(e[0] !== 'compendium' && e[0] !== 'html'));
        if (checks.length > 0) {  
            let foundChars = Campaign.characters.models;
            await Promise.all(checks.map((chk,i) => {
                let findIndexFunc;
                let rxAttr = new RegExp(`${chk[0]}`, 'i'), rxVal;
                if (chk[1]) {
                    rxVal = new RegExp(`${chk[1]}`, 'i');
                    findIndexFunc = (a) => ( rxAttr.test(a.get('name')) && rxVal.test(a.get('current')) );
                } else findIndexFunc = (a) => (rxAttr.test(a.get('name')));
                foundChars = foundChars.filter(c=> c.attribs.models.findIndex(findIndexFunc) !== -1);
                ccLog(foundChars.length, 'log', `checkSystem pass ${i}`);
            }));
            if (foundChars.length) passAttrTest = true;
        } else passAttrTest = true;
        if (!passAttrTest) {
            ccLog(`Failed Attribute test`, 'warn', `gameSystemCheck`);
            return false;
        }
        return true;
    }
    const getCharsheetDataFB = async () => {
        const e = `/editor/charsheetdata/${window.campaign_id}`;
        return new Promise((t, i) => {
            let n = 0;
            const o = () => {
                $.ajax({
                    url: e,
                    type: "GET",
                    error: e => {
                        n < 2 ? (n += 1, o()) : i(e)
                    },
                    success: e => {
                        const i = JSON.parse(e);
                        t(i)
                    }
                })
            };
            o()
        })
    }
    const decodeCharsheetData = async (data) => {
        if (data.html) data.html = window.BASE64.decode(data.html);
        if (data.css) data.css = window.BASE64.decode(data.css);
        if (data.translation) data.translation = window.BASE64.decode(data.translation);
        return data;
    }

    return {
        ccLog,
        checkID,
        checkCCID,
        generateCCID,
        generateRowId,
        validateDragItem,
        emproper,
        getState,
        updateState,
        saveState,
        getItemFromState,
        saveItemToState,
        saveCollectionToState,
        deleteItemFromState,
        editItemFlags,
        verifyCollectionItems,
        settings,
        getAttrs,
        getLinkedHandout,
        importStateFromFile,
        mergeCompendiums,
        fakeTrigger,
        cloneObj,
        toArray,
        timeout,
        asyncInterval,
        insertHTMLfromString,
        dragElement,
        escapeRegex,
        checkGameSystem,
        ver,
        config,
        rx,
    }

})();