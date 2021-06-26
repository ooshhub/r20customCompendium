/* globals CCH, CCH5e, $, customCompendium, occDialog */

// Set up Observer for char sheets opening, then add custom jQuery drag and drop listener
const CCUI = (() => { // eslint-disable-line no-unused-vars

	// Mutation Observer to watch for Character Sheets opening, then inject code
	let ccOpenCharSheet = new MutationObserver((targets) => {
		let charFrame;
		targets.forEach((t) => {
			t.addedNodes.forEach(n => {
				// First time opening of Char Sheet => Add a JQ .droppable() to the outer <div> for custom item drops
				if (/characterdialog/i.test(n.className)) { 
					charFrame = n;
					CCH.ccLog(`Adding custom DD events`);
					if (!/oosh-cc/.test(charFrame.className)) {
						charFrame.classList.add(`oosh-cc`);
						$(charFrame).droppable({
							accept: ".oosh-cc-item, .oosh-cc-collection",
							tolerance: "pointer",
							greedy: true,
							drop: function (event, ui) {
								event.preventDefault();
								event.stopPropagation();
								//CCH.ccLog([event, ui]);
								let target = event.target.dataset.characterid;
								let itemData = {
									id: ui.helper?.[0].dataset.id,
									name: ui.helper?.[0].dataset.name,
									category: ui.helper?.[0].dataset.itemcat,
									subCategory: ui.helper?.[0].dataset.itemsubcat,
								};
								customCompendium.handleSheetDrop(target, itemData);
							}
						});
						fireSheetEvent($(charFrame).find('iframe')||null);
					}
				// If sheet has been opened before this session, only the iframe is created on subsequent opens. Listen for that, too:
				} else if (/iframe/i.test(n.tagName) && /characterdialog/i.test(n.parentElement.className)) {
					fireSheetEvent(n);
				}
			})
		})
	});
	let sheetEventInProgress = false;
	const fireSheetEvent = (iframe) => { // Custom even handler for sheet injection
		if (sheetEventInProgress) return;
		sheetEventInProgress = true;
		if (!iframe) return CCH.ccLog(iframe, 'error', `Bad element passed to Character Script injector`);
		let charReady = setInterval(() => {
			if ($(iframe).contents()?.get(0).readyState === 'complete') {
				if ($(iframe).contents().find('.btn.ui-draggable').length > 10) {
					clearInterval(charReady);
					setTimeout(() => {
						let target = $(iframe).contents().get(0);
						document.getElementById('ccCustomEvents').dispatchEvent(new CustomEvent('customInject', {detail: {'target': target, 'scripts': ''}}));
						setTimeout(() => { // Stop multiple events firing. Fixing the Observer is a better solution
							//console.log(`resuming...`);
							sheetEventInProgress = false;
						}, 5000);
					},1);
				}
			} else CCH.ccLog(`Searching for character sheet document ready state...`)
		}, 1000);
	}
	const targetNode = document.body;
	const config = {attributes: false, childList: true, subtree: true};
	ccOpenCharSheet.observe(targetNode, config); // Initialise the Mutation Observer

	// CSS CLASSES - Might need to dick around with these later
	const cccss = {
		subcat: `oosh-cc subcategory-header`,
		item: `oosh-cc-item compendium-item`,
		collection: `oosh-cc-collection compendium-item`,
	}

	const flagIcons = {
		links: `<i class="fas fa-link"></i>`,
		collection: `<i class="fas fa-layer-group"></i>`,
		hidden: `<i class="fas fa-eye-slash"></i>`
	}

	// Draw the main Custom Compendium data table
	const refreshTable = (categories) => {
		const isGM = window.is_gm||false;
		//let gmVisibility = isGM ? '' : ` data-isgm-visibility="false"`;
		let gmDisplay = isGM ? '' : ` data-isgm-display="false"`;
		let saveFlag = false;
		let comp = CCH.settings('compendium')||'default';
		let catArr = categories ? categories : CCH.settings('category')||'item';
		catArr = Array.isArray(catArr) ? catArr : [catArr];
		CCH.ccLog(catArr, 'info', `Table Categories`)
		let compObj = Campaign.attributes?.[CCH.config.keys.ccState]?.[comp];
		if (!compObj) {
			occDialog.alertBox(`Out of cheese error!`, `Could not find a Custom Compendium profile!`, 'error');
			compObj = CCH5e.validate.emptyObject();
		}
		//CCH.ccLog(`Compiling table data!`);
		catArr.forEach(cat => {
			let tableHTML = '';
			for (let subCat in compObj[cat]) {
				if (compObj[cat][subCat]?.length>1 || compObj[cat][subCat][0]) {
					let subTableHTML = `<div class="${cccss.subcat}"><span>${CCH.emproper(subCat)}</span></div>`;
					compObj[cat][subCat].forEach(item => {
						let itemClass =  (CCH5e.validate.category.includes(item.category)) ? cccss.item : cccss.collection;
						if (!item.id || !CCH.checkCCID(item.id)) {
							CCH.ccLog(`Couldn't find id for item, creating one now...`);
							saveFlag = true;
							item.id = CCH.generateCCID();
						}
						let flags = item.flags||{}; // Backward compatibility for missing flags object
						let itemDisplay = (!isGM && flags.hidden) ? gmDisplay : '';
						subTableHTML += `
							<div class="oosh-cc table-row" ${itemDisplay} ${isGM ? '' : 'data-isgm="false"'}>
								<div class="${itemClass} ${cat}-${subCat}" data-id="${item.id}" data-name="${item.name||'unnamed'}" data-itemcat="${cat||'item'}" data-itemsubcat="${subCat||'weapon'}" draggable="true">
									<div class="oosh-cc table-row-itemname">
										<span>${CCH.emproper(item.name)}</span>
										<span>${flags.collection?.length ? flagIcons.collection : ''}${flags.hidden ? flagIcons.hidden : ''}${flags.links?.length ? `${flagIcons.links}${flags.links.join('')}` : ''}</span>
									</div>
								</div>
								<div class="oosh-cc table-row-controls" ${gmDisplay}>
									<button class="button cc-edit-item "><i class="fas fa-edit"></i></button>
									<button class="button cc-delete-item"><i class="fas fa-trash"></i></button>
								</div>
								<span class="oosh-cc-tooltip tt-${item.id||'null'}">${item.flags?.tooltip?.join('<br>')||'No tooltip found'}</span>
							</div>`
					});
					tableHTML += subTableHTML;
				}
			}
			let containerTarget = document.querySelector(`#oosh-cc-${cat}-table-body`);
			if (containerTarget) {
				while (containerTarget.firstChild) {
					containerTarget.removeChild(containerTarget.firstChild);
				}
				CCH.insertHTMLfromString(tableHTML, containerTarget);
			} else CCH.ccLog(`Couldn't update table ${cat}`, 'error', `oCC data error`);
		});
		if (saveFlag) { // if Compendium object was modified (e.g. missing id's) then save it back to Campaign
			CCH.updateState(compObj);
		}
		usefuliseTable();
	}

		

	// Set up all handlers for table each refresh
	const usefuliseTable = () => {

		// Add tooltip to element. First parameter is valid JQ selector or collection. Second is classname of target tooltip element.
		const addTooltip = (selector, tooltipId) => {
			const ttDelay = 1000;
			let tt = $(`.tt-${tooltipId}`);
			$(selector)
				.addClass('has-tt')
				.hover(() => {
					$(selector).data('hoverTimer', 1);
					setTimeout(() => {
						if ($(selector).data('hoverTimer')) {
							$(selector).data('hoverTimer', 0);
							tt.css('visibility', 'visible');
						}
					}, ttDelay);
				}, () => {
					$(selector).data('hoverTimer', 0);
					tt.css('visibility', 'hidden');
				});
		}

		// Apply a Roll20-like droppable handler to all the Custom Compendium entries
		$(`.oosh-cc-item, .oosh-cc-collection`).each((i, el) => {
			if (!$(el).data('ui-draggable')) {
				$(el).draggable({ // tidied up from app.js code. Triggers drop target style on character sheet. Does stuff with z-index. Smells funny.
					revert: true,
					distance: 10,
					revertDuration: 0,
					helper: "clone",
					appendTo: "body",
					scroll: false,
					iframeFix: true,
					start() {
						//CCH.ccLog(`Starting JQ Drag...`, 'info');
						$(".characterdialog iframe").css("pointer-events", "none"), $(".characterdialog .charsheet-compendium-drop-target").show();
						// Disable drops to canvas while dragging. Probably unnecessary, but this stops the console errors.
						$('#finalcanvas').droppable('disable');
						//$('#finalcanvas').droppable('option', {addClasses: false});
						$('#finalcanvas').removeClass('ui-state-disabled');
					},
					drag(e) {
						(e => {
							let t, i = 0;
							const n = [];
							$(".characterdialog[data-characterid]").each((e, o) => {
								const r = Campaign.characters.get($(o).data("characterid"));
								if (r && r.view.dragOver) {
									const e = parseInt(r.view.$el.parent().css("z-index"));
									n.push(r), e > i && (t = r.id, i = e)
								}
							}), n.forEach(i => {
								if (i.id === t) {
									const t = i.view.$el.offset();
									i.view.compendiumDragOver(e.pageX - t.left, e.pageY - t.top), i.view.activeDrop = !0
								} else i.view.activeDrop = !1, i.view.compendiumDragOver()
							})
						})(e)
					},
					stop() {
						$(".characterdialog iframe").css("pointer-events", "auto"), $(".characterdialog .charsheet-compendium-drop-target").hide()
						$('#finalcanvas').droppable('enable');
					}
				});
				// Add JQ handler for Tooltip Hover, edit ttDelay for tooltip delay in ms
				//CCH.ccLog(`Adding tooltip function...`);
				if (!$(el).attr('class').match(/has-tt/i)) {
					let id = $(el).data('id');
					addTooltip(el, id);
				}
			}
		});
		// Add flag key tooltip
		$('.flag-icons-key').each((i,el) => addTooltip(el, 'flag-key'));
		//addTooltip('#flag-icons-key', 'flag-key');
		
		// Edit & Delete row buttons
		// Delete item button
		$('.cc-delete-item').each((i, el) => {
			if ($._data(el, 'events')?.click) {
				//CCH.ccLog(`Element already has click event`);
			} else {
				$(el).on('click', async () => {
					let target = $(el).closest('.table-row').find('.compendium-item');
					//CCH.ccLog(target);
					let confirm = await occDialog.yesNo(`Delete Entry`, `Are you sure you wish to delete "${target.data('name')}"?`, ['','']);
					if (!confirm) return;
					let deleteTarget = {
						id: target.data('id')||null,
						category: target.data('itemcat')||null,
						subCategory: target.data('itemsubcat')||null,
					}
					CCH.ccLog(deleteTarget, 'info');
					if (CCH.deleteItemFromState(deleteTarget)) refreshTable();
				});
			}
		});
		// Edit button for CC Items and CC Collections
		$('.cc-edit-item').each((i, el) => {
			if (!$._data(el, 'events')?.click) {
				$(el).on('click', async () => {
					let target = $(el).closest('.table-row').find('.compendium-item');
					let targetData = {
						id: target.data('id')||null,
						category: target.data('itemcat')||null,
						subCategory: target.data('itemsubcat')||null
					};
					let currentComp = CCH.settings('compendium')||'default';
					let targetItem = Campaign.attributes[CCH.config.keys.ccState]?.[currentComp]?.[targetData.category]?.[targetData.subCategory]?.find(i => i.id === targetData.id);
					if (!targetItem) {
						await occDialog.alertBox('Item Error', `Couldn't find item, see console log for error details`, 'error');
						CCH.ccLog(target, 'error', 'Item lookup error data:');
						return;
					}
					CCH.ccLog(`Opening edit dialog for item ${target.data('id')}...`);
					let finalItem;
					// Split into Item and Collection classes here
					if (CCH5e.validate.category.includes(targetData.category)) { // Normal CC Items
						finalItem = await occDialog.editDialog(targetItem);
					} else { // Collection Items
						let collectionReturn = await occDialog.editCollectionDialog(targetItem);
						finalItem = await CCH.verifyCollectionItems(collectionReturn)?.[0];
					}
					if (finalItem) {
						await CCH.saveItemToState(finalItem, true).then(v => {
							if (v) refreshTable();
						});
					} else CCH.ccLog('Item update canceled');
				});
			}
		});
	};

	// Drop event handlers for the Header section
	const ccDrop = (event) => {
		event.preventDefault();
		let rawData = event.dataTransfer.getData("text");
		let data;
		try{data = JSON.parse(rawData)}catch(err){CCH.ccLog(`Error parsing drag data:`, 'error', rawData)}
		if (data) customCompendium.handleReverseDrop(data);
	}

	const ccAllow = (event) => {
		event.preventDefault();
		document.getElementById('oosh-cc-header').style.background = '#00bfff';
	}



	// Startup
	const initialiseTable = () => { //eslint-disable-line no-unused-vars
		// Full table refresh
		refreshTable(CCH5e.validate.combinedCategories());
		// Header dropzone for reverse drag/thief mode
		let hdr = document.getElementById(`oosh-cc-header`);
		hdr.addEventListener('dragover', (ev) => ccAllow(ev));
		hdr.addEventListener('drop', (ev) => ccDrop(ev));
	}

	// Close button fallback for modal pop-up crashes
	const closeDialog = () => {
		$('.occ-modal.dialog-header-close').on('click', (ev) => {
			setTimeout(() => {
				if ($(ev.delegateTarget).length) {
					console.log('close button fallback triggered');
					let outer = $(ev.delegateTarget).closest('.occ-modal.dialog-outer');
					outer.remove();
				}
			}, 1);
		});
	}

	return {
		refreshTable,
		initialiseTable,
		closeDialog,
	}
})();