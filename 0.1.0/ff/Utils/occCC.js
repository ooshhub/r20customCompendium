/* globals $, CCH, CCH5e, CCUI, CCCollection */
// Custom Dialog boxes

const occDialog = (() => { //eslint-disable-line no-unused-vars

	const asyncConstructor = Object.getPrototypeOf(async function(){}).constructor;

    class DialogBox {
        constructor(options) {
            this.title = options?.title||'Dialog Box';
            this.content = /^[\n\s]*<(span|div)/s.test(options?.content) ? options.content : `<span>${options?.content||'Please select an option'}</span>`;
            this.class = options?.class||'occ-modal';
			this.outerClass = options?.outerClass||options?.class||'occ-modal';
			this.target = options.target||parent.document.body;
			this.position = options.position?.length === 2 ? options.position : [$(document).height()/2, $(document).width()/2];
            this.buttons = [];
			this.default = null; // ENTER key action. Defaults to button 0. Assign in button object with default: true
			this.focus = options.focus||null;
			this.onRender = typeof(options?.onRender) === 'function' ? options?.onRender : null;
            this.onClose = typeof(options?.onClose) === 'function' ? options?.onClose : null;

			const functionToAsync = (syncFunction) => { // convert button callbacks to Async if they aren't already
				syncFunction = typeof(syncFunction) === 'string' ? syncFunction : syncFunction.toString();
				let params = syncFunction.match(/\((.*)\)/)?.[1]?.split(/,/g)||'';
				let func = /=>/.test(syncFunction) ? syncFunction.replace(/.*?=>/, '') : syncFunction.replace(/^function \([^)]*?\)/, '');
				return ((params || params==='') && func) ? asyncConstructor('', func) : null;
			}

            options.buttons?.forEach((btn, i) => {
                btn.label = btn.label || btn.label === '' ? btn.label : `Button ${i}`;
                let aweArr = btn.awesome ? Array.isArray(btn.awesome) ? btn.awesome : [`${btn.awesome}`, 's'] : null;
                btn.awesome = aweArr ? `<i class="fa${aweArr[1]||'s'} fa-${aweArr[0]}"></i>` : '';
				if (btn.default) this.default = i;
                btn.callback = typeof(btn.callback) === 'function' ? /^\s*async/i.test(btn.callback.toString()) ? btn.callback : functionToAsync(btn.callback.toString()) : () => {};
				btn.closeOnClick = (btn.closeOnClick != undefined && typeof(btn.closeOnClick) !== 'undefined') ? btn.closeOnClick : true;
                this.buttons.push(btn);
            });
            if (this.buttons.length < 1) this.buttons = [{label:'OK',awesome:'',default:true, callback:async ()=>{return true}}];
			if (!this.default) this.default = 0;
        }

		async render () {
			const dc = this.class;
			const buildHTML = async (dialogData) => {
				const validateKeys = ['title', 'content', 'class', 'buttons', 'onClose'];
				validateKeys.forEach(k=>{if (!Object.keys(dialogData).includes(k)) return console.error(`Bad Dialog class object provided`, dialogData)});
				let buttonsHTML = '';
				let dc = dialogData.class;
				dialogData.buttons.forEach((b,i) => {
					buttonsHTML += `<div class="${dc} dialog-button-div"><button id="${dc}-button-${i}" class="${dc} dialog-button">${b.awesome}${b.label}</button></div>`
				});
				let HTML = `
					<div class="${dialogData.outerClass} dialog-outer">
						<div class="${dc} dialog-header">
							<div class="${dc} dialog-header-text"><span>${dialogData.title}</span></div>
							<div class="${dc} dialog-header-close"><button id="${dc}-close-button"><i class="far fa-window-close"></i></button></div>
						</div>
						<div class="${dc} dialog-body">
							${dialogData.content}
						</div>
						<div class="${dc} dialog-buttons">
							${buttonsHTML}
						</div>
					</div>
				`;
				return HTML;
			}
			// Any non-button JS required
			const buildJS = (dialogData, dialogElement) => {
				let defBtn = this.default||0;
				let dc = dialogData.class;
				$(dialogElement).find(`#${dc}-close-button`)?.on('click', () => {
					console.log('close button clicked');
					this.onClose();
					dialogElement.remove();
				});
				$(dialogElement).keypress(ev => {
					if (ev.which == 13) {
						$(`#${dc}-button-${defBtn}`).triggerHandler('click');
					}
				});
				if ($(dialogData.focus)?.length) $(dialogData.focus).focus();
				else $(`#${dialogData.class}-button-0`).focus();
			}
			let HTML = await buildHTML(this);
			// Append template to document
			let dialogTemplate = document.createElement('template');
			dialogTemplate.innerHTML = HTML;
			let dialog = dialogTemplate.content;
			let containerTarget = (this.target) ? this.target : parent.document.body;
			try {
				await containerTarget.appendChild(dialog);
				CCUI.closeDialog();
			} catch(err) {
				console.warn(`Couldn't find target element`, err);
				containerTarget = parent.document.body;
				await parent.document.body.appendChild(dialog);
			}
			if (this.onRender) this.onRender();
			let newElement = $(`.${this.outerClass.trim().replace(/\s/g, '.')}.dialog-outer`).last();
			$(newElement).css({top: `${this.position[0]}px`, left: `${this.position[1]}px`});
			buildJS(this, newElement);

			// Wrap the buttons in a Promise so they can be Awaited, pausing code execution
			return new Promise((resolve) => {
				this.buttons.map(async (b,i) => {
					//console.log(b.callback.toString());
					$(newElement).find(`#${dc}-button-${i}`).on('click', async () => await b.callback().then(v=>{
						resolve(v);
						if (b.closeOnClick) {
							this.onClose();
							newElement.remove();
						}
					}));
				})
			});
		}
	}

	// Custom Compendium specific functions
	const primaryClass = 'occ-modal';
	const mainElement = '#oosh-cc-frame';

	// Helper to blur main UI when modal is active
	const blurMainUI = (enable) => {
		let mainUI = '#oosh-cc-frame';
		if (!$(mainUI)?.length) return;
		if (enable) $(mainUI).css({filter: 'blur(3px)', 'pointer-events': 'none'});
		else $(mainUI).css({filter: '', 'pointer-events': ''});
	}

	// Helper to grab the coords of the main UI
	const getMainCoords = (offsets) => {
		if (!$(mainElement)?.length) return [50, parseInt(screen.availWidth/2, 10)||500];
		let top = isNaN($(mainElement)?.css('top').match(/\d+/)?.[0]) ? null : parseInt($(mainElement)?.css('top').match(/\d+/)?.[0],10)||100;
		let left = isNaN($(mainElement)?.css('left').match(/\d+/)?.[0]) ? null : parseInt($(mainElement)?.css('left').match(/\d+/)?.[0],10)||500;
		offsets = offsets?.length === 2 ? [offsets[0], Math.abs(offsets[1])] : [200, 50];
		offsets[1] = left < 200 ? offsets[1] : -offsets[1];
		return [Math.max(top+offsets[0],50), left+offsets[1]];
	}

	// Simple yes/no dialog box, returns boolean
	const yesNo = async (boxTitle, boxMsg, buttonLabels=['Yes','No']) => { // provide title and content, returns true or false.
		buttonLabels = (Array.isArray(buttonLabels) && buttonLabels.length === 2) ? buttonLabels : ['Yes','No'];

		let data = {
			title: boxTitle||'Confirmation',
			content: boxMsg||'Make a selection...',
			class: primaryClass,
			position: getMainCoords(200, 50),
			buttons: [
				{
					label: buttonLabels[0],
					awesome: ['check-circle', 'r'],
					callback: async () => {return true},
					//default: true,
				},
				{
					label: buttonLabels[1],
					awesome: ['ban','s'],
					callback: async () => {return false},
				}
			],
			onRender: () => blurMainUI(true),
			onClose: () => blurMainUI(false)
		}
		let newYesNo = new DialogBox(data);
		return await newYesNo.render();
	}

	// Simple text input box, returns entered text
	const textInput = async (boxTitle, boxMsg, placeholder, buttonLabels=['','']) => { // returns entered text or FALSE if cancel clicked
		boxMsg = boxMsg||`Please enter text:`;
		let data = {
			title: boxTitle||'Input Text',
			content: `
			<span>${boxMsg}</span>
			<input type="text" class="${primaryClass} dialog-text-input" id="occ-dialog-text-input" placeholder="${placeholder||'Text...'}"/>
			`,
			class: primaryClass,
			position: getMainCoords(200, 50),
			focus: `.${primaryClass}.dialog-text-input`,
			buttons: [
				{
					label: buttonLabels[0]||'',
					awesome: ['check-circle', 'r'],
					callback: async () => {
						let x = $('#occ-dialog-text-input').val();
						CCH.ccLog(`Passing through value ${x} from modal box`);
						return x;
					},
				},
				{
					label: buttonLabels[1]||'',
					awesome: ['ban','s'],
					callback: async () => {return false},
				}
			],
			onRender: () => blurMainUI(true),
			onClose: () => blurMainUI(false)
		};
		let newTextInput = new DialogBox(data);
		return await newTextInput.render();
	}

	// Simple drop-down selection. Supply Select options as an array of 2-length arrays as [ ['Label 1', 'returnVal1'], ['Label 2', 'returnVal2'] ]
	// Returns the Label if no return value is supplied
	const dropdownSelect = async (boxTitle, boxMsg, dropdownOptions, buttonLabels=['','']) => {
		boxMsg = boxMsg||`Please select an option:`;
		let selectOptionsHTML = '';
		dropdownOptions = CCH.toArray(dropdownOptions);
		dropdownOptions.forEach(o => {
			o = CCH.toArray(o);
			selectOptionsHTML += `<option value="${o[1]||o[0]}">${o[0]}</option>`;
		});
		let data = {
			title: boxTitle||'Select Option',
			content: `
			<span>${boxMsg}</span>
			<select class="${primaryClass} dialog-select-option" id="occ-dialog-select-option">
				${selectOptionsHTML}
			</select>
			`,
			class: primaryClass,
			position: getMainCoords(200, 50),
			focus: `.${primaryClass}.dialog-select-option`,
			buttons: [
				{
					label: buttonLabels[0]||'',
					awesome: ['check-circle', 'r'],
					callback: async () => {
						let x = $('#occ-dialog-select-option').val();
						CCH.ccLog(`Passing through value ${x} from modal box`);
						return x;
					},
				},
				{
					label: buttonLabels[1]||'',
					awesome: ['ban','s'],
					callback: async () => {return false},
				}
			],
			onRender: () => blurMainUI(true),
			onClose: () => blurMainUI(false)
		};
		let newSelectInput = new DialogBox(data);
		return await newSelectInput.render();
	}

	const alertBox = async (boxTitle, boxMsg, alertType='info') => {
		alertType = /^e/i.test(alertType) ? 'error' : /^w/i.test(alertType) ? 'warn' : /^i/i.test(alertType) ? 'info' : 'log';
		let alertIcon = alertType === 'error' ? 'fas fa-exclamation-circle' : alertType === 'warn' ? 'fas fa-hand-paper' : alertType === 'info' ? 'fas fa-info-circle' : 'fas fa-exclamation';
		let data = {
			title: boxTitle||'Attention',
			content: `
				<div class="${primaryClass}-${alertType}">
				 	<i class="${alertIcon}"></i>
					<span>${boxMsg}</span>
				</div>`,
			class: primaryClass,
			position: getMainCoords(200, 50),
			buttons: [
				{
					label: '',
					awesome: 'check',
					callback: async () => {return true},
				}
			],
			onRender: () => blurMainUI(true),
			onClose: () => blurMainUI(false),
		};
		let newAlert = new DialogBox(data);
		return await newAlert.render();
	}

	// Edit dialog for custom compendium items, CCItem
	const editDialog = async (ccItem) => {
		let nameAttribute = ccItem.data.find(a=>a.name === CCH5e.nameAttribute[ccItem.category])?.name||null;
		let catSelectHTML//, subCatSelectHTML;
		CCH5e.validate.category.forEach(c=> {
			let defSelect = (ccItem.category === c) ? ' selected' : '';
			catSelectHTML += `<option value="${c}"${defSelect}>${CCH.emproper(c)}</option>`;
		});
		let subCatSelectHTML = '';
		CCH5e.validate.subCategory[ccItem.category]?.forEach(subcat => {
			let defSelect = subcat === ccItem.subCategory ? ' selected' : '';
			subCatSelectHTML += `<option value="${subcat}" ${defSelect}>${CCH.emproper(subcat)}</option>`;
		});
		let mainAttributesHTML = `
		<div class="edit-attribute">
			<span>Name:</span>
			<input type="text" id="edit-attribute-name" value="${ccItem.name}"/>
		</div>
		<div class="edit-attribute">
			<label for="edit-item-hidden">Hidden from players: <input id="edit-item-hidden" type="checkbox" ${ccItem.flags?.hidden ? 'checked' : ''}></label>
		</div>
		<div class="edit-attribute">
			<span>Category:</span>
			<select id="edit-attribute-category" value="${ccItem.category}" disabled>${catSelectHTML}</select>
		</div>
		<div class="edit-attribute">
			<span>Tooltip - separate lines with a <b>;</b> semi-colon</span>
			<textarea id="edit-item-tooltip">${ccItem.flags?.tooltip?.join('; ')||''}</textarea>
		</div>
		<div class="edit-attribute">
			<span>Subcategory:</span>
			<select id="edit-attribute-subcategory">${subCatSelectHTML}</select>
		</div>
		`;

		let otherAttributesHTML = ``;
		ccItem.data.forEach(a => {
			if (a.name !== nameAttribute) {
				// need to escape punctuation to make sure id's don't get messed up - escape any " ' ` etc.
				otherAttributesHTML += `
				<div class="${primaryClass} edit-attribute">
					<span id="${a.name}">${a.name.replace(/_-[A-Za-z0-9_-]{19}_/g, '_$id_').replace(/repeating/i, 'rep')}</span>
					<textarea id="edit-attribute-current">${a.current}</textarea>
					<textarea id="edit-attribute-max">${a.max}</textarea>
				</div>`;
			}
		});

		let HTML = `
			<div class="${primaryClass} edit-path">
				${CCH.settings('compendium')} / ${ccItem.category} / ${ccItem.subCategory} / ${ccItem.id}
			</div>
			<hr>
			<div class="${primaryClass} edit-main-attributes">
				${mainAttributesHTML}
			</div>
			<hr>
			<div class="${primaryClass} edit-headings">
				<span>Attribute Name</span>
				<span>Current Value</span>
				<span>Max Value</span>
			</div>
			<hr>
			<div class="${primaryClass} edit-other-attributes">
				${otherAttributesHTML}
			</div>
		`;

		let data = {
			title: `Edit Compendium Item`,
			content: HTML,
			class: `${primaryClass}`,
			outerClass: `${primaryClass} edit-item`,
			position: [25, 25],
			focus: `.${primaryClass}.dialog-text-input`,
			buttons: [
				{
					label: '',
					awesome: ['check-circle', 'r'],
					callback: async () => { // Return all attributes & values as a new ccItem object
						let cloneItem = JSON.parse(JSON.stringify(ccItem));
						cloneItem.data = [];
						if ($('#edit-attribute-name').val() !== cloneItem.name) {
							cloneItem.name = $('#edit-attribute-name').val();
							if (nameAttribute) cloneItem.data.push({name: nameAttribute, current: cloneItem.name, max: ''});
						}
						cloneItem.category = CCH5e.validate.category.includes($('#edit-attribute-category').val()) ? $('#edit-attribute-category').val() : cloneItem.category;
						cloneItem.subCategory = CCH5e.validate[cloneItem.category]?.includes($('#edit-attribute-subcategory').val()) ? $('#edit-attribute-subcategory').val() : cloneItem.subCategory;
						// Flags section - tooltip text & other options
						cloneItem.flags.hidden = $('#edit-item-hidden').prop('checked') ? true : false;
						cloneItem.flags.tooltip = $('#edit-item-tooltip').val().split(/\s*;\s*/);
						$('.edit-other-attributes .edit-attribute').each((i, el) => {
							let attrName = $(el).find('span').eq(0).prop('id');
							let attrVal = $(el).find('#edit-attribute-current').val()||'';
							let attrMax = $(el).find('#edit-attribute-max').val()||'';
							if (attrName) cloneItem.data.push({name: attrName, current: attrVal, max: attrMax});
						});
						CCH.ccLog(cloneItem, 'info', `Cloned Item returned from occDialog box`);
						return cloneItem;
					},
				},
				{
					label: '',
					awesome: ['ban','s'],
					callback: async () => {return false},
				}
			],
			onRender: () => {
				blurMainUI(true);
				CCH.dragElement($(`.${primaryClass}.edit-item.dialog-outer`)[0], $(`.${primaryClass}.dialog-header`)[0]);
				// Auto-size textarea elements according to content
				$('.edit-attribute textarea').each((i,el)=>{
					$(el).css('height', '5px');
					$(el).css('height', `${$(el).prop('scrollHeight')}px`);
				});
				// Add tooltip info for clipped attribute names
			},
			onClose: () => blurMainUI(false)
		};
		let newEditWindow = new DialogBox(data);
		return await newEditWindow.render();
	}

	// Edit dialog for Collections items, CCCollection
	const editCollectionDialog = async (ccCollection) => {
		let catSelectHTML, subCatSelectHTML = '';
		CCH5e.validate.collectionCategory.forEach(c=> {
			let defSelect = (ccCollection.category === c) ? 'selected' : '';
			catSelectHTML += `<option value="${c}"${defSelect}>${CCH.emproper(c)}</option>`;
		});
		CCH5e.validate.subCategory[ccCollection.category]?.forEach(sc => {
			let defSel = (sc === ccCollection.subCategory ? 'selected' : '');
			subCatSelectHTML += `<option value="${sc}" ${defSel}>${CCH.emproper(sc)}</option>`;
		});
		CCH.ccLog(subCatSelectHTML, 'info', `Subcategory HTML`);
		let mainAttributesHTML = `
		<div class="edit-attribute">
			<span>Name:</span>
			<input type="text" id="edit-attribute-name" value="${ccCollection.name}"/>
		</div>
		<div class="edit-attribute">
			<label for="edit-item-hidden">Hidden from players: <input id="edit-item-hidden" type="checkbox" ${ccCollection.flags?.hidden ? 'checked' : ''}></label>
		</div>
		<div class="edit-attribute">
			<span>Category:</span>
			<select id="edit-attribute-category" value="${ccCollection.category}" disabled>${catSelectHTML}</select>
		</div>
		<div class="edit-attribute">
			<span>Tooltip - separate lines with a <b>;</b> semi-colon</span>
			<textarea id="edit-item-tooltip">${ccCollection.flags?.tooltip?.join('; ')||''}</textarea>
		</div>
		<div class="edit-attribute">
			<span>Subcategory:</span>
			<select id="edit-attribute-subcategory">${subCatSelectHTML}</select>
		</div>
		`;
		
		// Refresh linked items list as required
		const refreshItemList = () => {
			let linkedItems = CCCollection.buildTiers.bind(ccCollection)();
			CCH.ccLog(linkedItems, 'info', 'CCC.buildTiers()');
			let linkedItemsHTML = ``;
			ccCollection.tiers.forEach(t => {
				linkedItemsHTML += `
					<div class="${primaryClass} edit-collection-tier" data-tier="${t}">
						<div class="${primaryClass} edit-collection-label">
							<span>${t}</span>
						</div>
						<div class="${primaryClass} edit-collection-linkeditems">`;
				if (linkedItems[t]) {
					linkedItems[t].forEach(i => {
					linkedItemsHTML += `
							<div class="${primaryClass} edit-collection-item" data-id="${i.id||null}" data-name="${i.name||'Unknown Item'}">
								<div class="${primaryClass} edit-collection-details">
									<span>${CCH.emproper(i.category)}</span>
									<span>${CCH.emproper(i.name)}</span>
								</div>
								<div class="${primaryClass} edit-collection-controls">
									<button class="cc-edit-collection"><i class="fas fa-edit"></i></button>
									<button class="cc-delete-collection"><i class="fas fa-trash"></i></button>
								</div>
							</div>`;
					});
				} else {
					linkedItemsHTML += `
							<div class="${primaryClass} edit-collection-item">
								<span> -</span>
							</div>`;
				}
				linkedItemsHTML += `
						</div>
					</div>`;
			});
			$(`.${primaryClass}.edit-collection-main`).empty();
			$(`.${primaryClass}.edit-collection-main`).append(linkedItemsHTML);
			// Apply Edit & Delete button functions
			setTimeout(() => {
				$('button.cc-edit-collection').on('click', async (ev) => {
					let itemID = $(ev.delegateTarget).closest('.edit-collection-item').data('id');
					CCH.ccLog(itemID, 'log', 'grabbing Collection ID from HTML');
					if (CCH.checkCCID(itemID)) {
						let newTier = await textInput(`Enter ${ccCollection.tierName}`, `Enter the new ${ccCollection.tierName} for this item:`);
						newTier = (isNaN(newTier)) ? newTier : parseInt(newTier, 10);
						if (ccCollection.tiers.includes(newTier)) {
							let result = CCCollection.editTier.bind(ccCollection, itemID, newTier)();
							if (!result) return alertBox(`Error`, 'Something went horribly wrong, see console for error');
							refreshItemList();
						} else return alertBox('Warning', `Invalid ${ccCollection.tierName} entered, aborting.`);
					} else return alertBox('Warning', `Invalid CCID found, aborting.`);
				});
				$('button.cc-delete-collection').on('click', async (ev) => {
					let itemID = $(ev.delegateTarget).closest('.edit-collection-item').data('id');
					let itemName = $(ev.delegateTarget).closest('.edit-collection-item').data('name');
					CCH.ccLog(itemID, 'log', 'grabbing Collection ID from HTML');
					if (CCH.checkCCID(itemID)) {
						let confirm = await yesNo(`Confirm`, `Are you sure you wish to remove ${itemName}?`);
						if (confirm) {
							let tier = $(ev.delegateTarget).closest('.edit-collection-tier').data('tier');
							let colItem = ccCollection.items.find(i=>i.id === itemID);
							let itemData = {id: colItem.linkId, category: colItem.category, subCategory: colItem.subCategory};
							let result = CCCollection.removeItem.bind(ccCollection, itemID, tier)();
							if (!result) return alertBox(`Error`, 'Something went horribly wrong, see console for error');
							CCH.editItemFlags(itemData, 'collection', ccCollection.id, true, true);
							refreshItemList();
						}
					} else return alertBox('Warning', `Invalid CCID found, aborting.`);
				});
			}, 1);
			if ($('#oosh-cc-add-link-mode')[0].checked) {
				CCH.ccLog('Refreshing Droppable JQ...');
				$('#oosh-cc-add-link-mode').trigger('change');
			}
			return linkedItemsHTML;
		}

		// Like Thief mode for the main UI, toggle to make target droppable
		const addLinksMode = (targetFrame, toggle) => {
			//CCH.ccLog(targetFrame, 'log', 'targetFrame');
			//CCH.ccLog($(targetFrame));
			let targetAreas = $(targetFrame).find('.edit-collection-linkeditems');
			if (toggle) {
				CCH.ccLog(null, 'info', 'Droppable turned on');
				$(targetFrame).css({['z-index']: 11500});
				blurMainUI(false);
				// Disable Compendium profile & import-export controls
				$('#oosh-cc-select-data, .oosh-cc.toolbar.button, .oosh-cc.toolbar.input').prop('disabled', true);
				targetAreas.droppable({
					accept: ".oosh-cc-item",
					tolerance: "pointer",
					greedy: true,
					classes: {
						'ui-droppable': `edit-collection-item-dropzone`,
						'ui-droppable-hover': `edit-collection-item-dropzone-hover`
					},
					hoverClass: 'ui-droppable-hover',
					drop: function (event, ui) {
						event.preventDefault();
						event.stopPropagation();
						//CCH.ccLog([event, ui], 'info', 'Drag info');
						let itemData = {
							id: ui.helper?.[0].dataset.id,
							name: ui.helper?.[0].dataset.name,
							category: ui.helper?.[0].dataset.itemcat,
							subCategory: ui.helper?.[0].dataset.itemsubcat,
						};
						let tier = $(event.target).closest('.edit-collection-tier')?.data('tier');
						if (tier) itemData[ccCollection.tierName] = tier;
						CCH.ccLog(itemData);
						CCCollection.addItem.bind(ccCollection, itemData, tier)();
						CCH.editItemFlags(itemData, 'collection', ccCollection.id, true);
						refreshItemList();
					}
				});
			} else {
				$(targetFrame).css({['z-index']: ''});
				blurMainUI(true);
				targetAreas.droppable('destroy');
				// Enable Compendium profile & import-export controls
				$('#oosh-cc-select-data, .oosh-cc.toolbar.button, .oosh-cc.toolbar.input').prop('disabled', false);
			}
		}

		let HTML = `
			<div class="${primaryClass} edit-path">
				${CCH.settings('compendium')} / ${ccCollection.category} / ${ccCollection.subCategory} / ${ccCollection.id}
			</div>
			<hr>
			<div class="${primaryClass} edit-main-attributes">
				${mainAttributesHTML}
			</div>
			<hr>
			<div class="${primaryClass} edit-collections-headings">
				<span>${CCH.emproper(ccCollection.tierName)||'Level'}</span>
				<span>Linked Compendium Items</span>
				<div class="oosh-cc switch">
					<label class="oosh-cc label" for="oosh-cc-add-link-mode">Add Items:</label>
					<input id="oosh-cc-add-link-mode" type="checkbox">
					<span class="slider round"></span>
				</div>
			</div>
			<hr>
			<div class="${primaryClass} edit-collection-main">
			</div>
		`;

		let data = {
			title: `Edit Compendium Collection`,
			content: HTML,
			class: `${primaryClass}`,
			outerClass: `${primaryClass} edit-item`,
			position: [25, 25],
			buttons: [
				{
					label: '',
					awesome: ['check-circle', 'r'],
					callback: async () => { // Return all attributes & values as a new ccItem object
						let cloneItem = CCH.cloneObj(ccCollection);
						cloneItem.name = $('#edit-attribute-name').val();
						cloneItem.category = CCH5e.validate.collectionCategory.includes($('#edit-attribute-category').val()) ? $('#edit-attribute-category').val() : cloneItem.category;
						cloneItem.subCategory = CCH5e.validate[cloneItem.category]?.includes($('#edit-attribute-subcategory').val()) ? $('#edit-attribute-subcategory').val() : cloneItem.subCategory;
						if (!cloneItem.flags) cloneItem.flags = {};
						// Flags section - tooltip text & other options
						cloneItem.flags.hidden = $('#edit-item-hidden').prop('checked') ? true : false;
						cloneItem.flags.tooltip = $('#edit-item-tooltip').val().split(/\s*;\s*/);
						CCH.ccLog(cloneItem, 'info', `Cloned Item returned from occDialog box`);
						return cloneItem;
					},
				},
				{
					label: '',
					awesome: ['ban','s'],
					callback: async () => {return false},
				}
			],
			onRender: () => {
				blurMainUI(true);
				refreshItemList();
				CCH.dragElement($(`.${primaryClass}.edit-item.dialog-outer`)[0], $(`.${primaryClass}.dialog-header`)[0]);
				$('#oosh-cc-add-link-mode').on('change', (ev) => {
					let parentDialog = ev.delegateTarget.closest(`.dialog-outer`);
					addLinksMode(parentDialog, ev.delegateTarget.checked||false);
				});
				$('.occ-modal .slider.round').on('click', () => $('#oosh-cc-add-link-mode').trigger('click'));
			},
			onClose: () => blurMainUI(false)
		};
		let newEditWindow = new DialogBox(data);
		return await newEditWindow.render();
	}

	const dropCollectionDialog = async (ccCollection) => {
		let tiersHTML = ``;
		ccCollection.tiers.forEach(t => {
			let currentLinks = ``;
			ccCollection.items?.forEach(item => {
				if (item[ccCollection.tierName] == t) {
					currentLinks += `
					<div class="${primaryClass} collection-item">
						<span>${CCH.emproper(item.category)}</span>
						<span>${CCH.emproper(item.name)}</span>
					</div>`;
				}
			});
			tiersHTML += `
				<div class="${primaryClass} collection-tier">
					<div class="${primaryClass} collection-tier-label">
						<input type="checkbox" class="${primaryClass} collection-checkbox" value="${t}"/>
						<span>${t}</span>
					</div>
					<div class="${primaryClass} collection-tier-links">
						${currentLinks}
					</div>
				</div>`;
		});
		let HTML = `
		<div class="${primaryClass} collection-title">
			<span>${ccCollection.name}</span>
			<span>Select required ${ccCollection.tierName}s:</span>
		</div>
		<hr>
		<div class="${primaryClass} drop-collections-headings">
			<span>${CCH.emproper(ccCollection.tierName)||'Level'}</span>
			<span>Linked Compendium Items</span>
		</div>
		<div class="${primaryClass} drop-collection-main">
			${tiersHTML}
		</div>`;

		let data = {
			title: `Drop Collection`,
			content: HTML,
			class: `${primaryClass}`,
			outerClass: `${primaryClass} drop-collection`,
			position: [25,25],
			buttons: [
				{
					label: '',
					awesome: ['check-circle', 'r'],
					callback: async () => {
						let checkTiers = [];
						await $(`.${primaryClass}.collection-checkbox`).each((i, el) => {
							let tier = ($(el).prop('checked')) ? $(el).val() : null;
							tier = (!tier || isNaN(tier)) ? tier : parseInt(tier, 10);
							if (tier) checkTiers.push(tier);
						});
						return checkTiers;
					},
				},
				{
					label: '',
					awesome: ['ban','s'],
					callback: async () => {return false},
				}
			],
			onRender: () => {blurMainUI(true)},
			onClose: () => blurMainUI(false)
		}
		let newCollectionDrop = await new DialogBox(data);
		return await newCollectionDrop.render();
	}

	return {
		DialogBox,
		yesNo,
		textInput,
		dropdownSelect,
		alertBox,
		editDialog,
		editCollectionDialog,
		dropCollectionDialog,
	}

})();