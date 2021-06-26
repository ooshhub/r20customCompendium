/* globals CCH */

class CCItem { //eslint-disable-line no-unused-vars
	constructor(name, category, subcategory, attributes, links, flags) {
		const storeAttrs = (r20attrArray) => {
			r20attrArray = Array.isArray(r20attrArray) ? r20attrArray : [r20attrArray];
			let output = [];
			r20attrArray.forEach(a=>{ // Maybe row id's should be removed before storage
				output.push({
					name: a.attributes?.name.toString().replace(CCH.rx.r20rowId, '_$rID$_')||'unknownAttr',
					current: a.attributes?.current.toString()||'',
					max: a.attributes?.max.toString()||''
				});
			});
			return output;
		}
        this.id = window?.generateUUID()?.replace(/^-/, 'C')||Math.random();
		this.name = name||`Unknown ${category}`;
		this.category = category||'misc';
		this.subCategory = subcategory||'misc';
		this.data = storeAttrs(attributes)||null;
		this.links = {}; // attack|handout|resource
		this.flags = typeof(flags) === 'object' ? flags : {}; // displayData for occUI? Image? GM-only?
        this.flags.ver = CCH.ver.getVer();
        // needs to be generic - Handout/attrArray/Object
        // redo how links are stored - object with storage instructions & abbreviation flag
		for (let l in links) {
			if (/attack/.test(l) && links[l]?.length) {
				this.links.attack = storeAttrs(links[l]);
			} else if (/handout/i.test(l) && links[l]?.name) {
				this.links.handout = links[l];
			} else if (links[l]) {
                this.links[l] = links[l];
            }
		}
        // needs to be generic
        if (Object.keys(this.links).length) {
            let flagArr = [];
            Object.keys(this.links).map(l => flagArr.push(l.slice(0,1).toUpperCase()));
            this.flags.links = flagArr;
        }
	}
    // Attribute getter for ccItem. If 'returnArray' set to true, returns filtered array of full attributes
    // returnValue setting only has an effect for single attribute return. Valid values 'current'/'max'/any other
    // value will return full Attribute object
    attrs(searchString, key='name', returnValue='current', searchLinked, returnArray=false, caseInsensitive=true) {
        caseInsensitive = caseInsensitive ? 'i' : '';
        let rx = new RegExp(`${searchString}`, caseInsensitive);
        let dataPath = (searchLinked) ? this.links[searchLinked] : this.data;
        let res = dataPath?.filter(a=>rx.test(a[key].toString()))||null;
        return (res?.length) ? 
                    (returnArray || /^arr/i.test(returnValue)) ? 
                        res : 
                    /^cur/i.test(returnValue) ? 
                        res[0].current : 
                    /^max/i.test(returnValue) ? 
                        res[0].max : 
                    res[0] : 
                null;
    }
    // Attribute setter. If newValue is an Array with 2 values, set Current + Max. If currentMax !== 'max', sets current.
    // If searchLinked not provided, datapath is CCItem.data. Supply 'attack' to search CCItem.links.attack
    attrSet(nameOrID, newValue, currentMax, searchLinked, caseInsensitive=true) {
        caseInsensitive = caseInsensitive ? 'i' : '';
        let dataPath = (searchLinked) ? this.links[searchLinked] : this.data;
        let target = (CCH.checkCCID(nameOrID)) ? dataPath.find(a=>a.id === nameOrID) : dataPath.find(a=>a.name.match(new RegExp(`${nameOrID}`, caseInsensitive)));
        if (!target) return false;
        try {
            if (newValue?.length === 2) {
                target.current = newValue[0];
                target.max = newValue[1];
            } else {
                currentMax = (/^m/i.test(currentMax)) ? 'max' : 'current';
                target[currentMax] = newValue;
            }
        } catch {
            CCH.ccLog([newValue, target], 'error', `NewValue could not be applied to Target`);
            return null;
        }
        return true;
    }
}

// This class is for things like a 5e Class/Subclass, a collection of CCItems which can be linked together and dropped together.
class CCCollection { //eslint-disable-line no-unused-vars
    constructor(name, category, subCategory, tierName, tiers, flags) {
        this.id = window.generateUUID()?.replace(/^-/, 'C')||Math.random();
		this.name = name||`Unknown ${category}`;
		this.category = category||'misc';
		this.subCategory = subCategory||'misc';
        this.tierName = tierName || 'Level';
        this.tiers = Array.isArray(tiers) ? tiers : (tiers) ? [tiers] : [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
		this.items = [];
		this.flags = typeof(flags) === 'object' ? flags : {};
    }
    static addItem(ccItem, tier) {
        if (!this.items) this.items = [];
        let newId = CCH.generateCCID();
        this.items.push({id: newId, linkId: ccItem.id, name: ccItem.name, category: ccItem.category, subCategory: ccItem.subCategory, [this.tierName]: tier});
        return true;
    }
    static editTier(collectionItemID, newTier) {
        let grabItem = this.items?.find(i=>i.id === collectionItemID);
        if (grabItem) {
            grabItem[this.tierName] = newTier;
            return true;
        } else {
            CCH.ccLog(this, 'error', 'Error updating CC Collection');
            return false;
        }
    }
    static removeItem(collectionItemID) {//, tier) { // add Tier filtering back in ??
        CCH.ccLog(this, 'info', 'removeItem');
        let removeIndex = this.items.findIndex(i => i.id === collectionItemID);
        CCH.ccLog(`remove ID: ${collectionItemID} - found at index: ${removeIndex}`);
        if (removeIndex > -1) {
            this.items.splice(removeIndex, 1);            
            return true}
        else {
            CCH.ccLog(this, 'error', 'Error updating CC Collection');
            return false;
        }
    }
    static buildTiers() {
        let lvl = this.tierName;
        let output = {};
        this.items?.forEach(i => {
            if (!output[i[lvl]]) output[i[lvl]] = [];
            output[i[lvl]].push(i);
        });
        CCH.ccLog(output, 'info', 'Collection buildTiers object');
        return output;
    }
}