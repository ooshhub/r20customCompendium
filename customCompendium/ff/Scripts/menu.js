/* globals CCH, CCH5e, customCompendium, CCUI, saveAs, $, occDialog */

const customCompendiumMenu = (() => { //eslint-disable-line no-unused-vars

	let ccStateKey;
	let ccSettingsKey;

	const occStartup = async () => { // eslint-disable-line no-unused-vars
		CCH.ccLog(`Waiting...`, 'log', 'Startup Process');
		CCH.timeout(3000);
		let campaignObjectReady;
		await CCH.asyncInterval((() => {if (window.Campaign && window.Campaign.get('bar1_color')) return true}), 1000, 30, true).then(v=>{
			CCH.ccLog(v, 'log', `Startup Process, return from interval`);
			campaignObjectReady = v;
		});
		if (!campaignObjectReady) return occDialog.alertBox(`Fatal Error`, `OCC couldn't find the Campaign object. Aborting.`, 'error');
		CCH.ccLog(`Campaign Object found!`, 'log', `OCC Startup`);
		let ccSheetSetting = $('#ccCustomEvents').data('gameSystem');
		let charSheetChecks = await CCH.checkGameSystem(ccSheetSetting);
		if (!charSheetChecks) return CCH.ccLog(`${ccSheetSetting} sheet not found, aborting`, 'warn', `OCC shutting down!`);
		CCH.ccLog(`${ccSheetSetting} sheet verified!`, 'info', `Game system test completed...`);
		initSettings();
	}


	// Load previous settings if found, or create new default settings object if not
	const initSettings = () => {
		ccStateKey = CCH.config.keys.ccState;
		ccSettingsKey = CCH.config.keys.settings.ccSettings;
		if (!Campaign.get(ccStateKey) || !(Object.keys(Campaign.attributes?.[ccStateKey])?.filter(o=>o!=='meta').length > 0) || !Campaign.attributes[ccStateKey]?.meta?.rootVersion >= CCH.ver.minSchema) {
			if (!window.is_gm) return occDialog.alertBox(`Fatal Error`, `The GM has not enabled a Custom Compendium for this game.`);
			CCH.ccLog(`Creating new Compendium State Object....`);
			let defaultStateObj = {
				meta: {rootVersion: CCH.ver.getVer(),rootSchema: CCH.ver.schema},
				default: {version: CCH.ver.getVer(), schema: CCH.ver.schema},
			};
			CCH.updateState(defaultStateObj, 'root');
			CCH.settings('compendium', 'default');
		} else CCH.ccLog(`Found the following custom compendiums: ${Object.keys(Campaign.attributes[ccStateKey])}`, 'info');
		if (!Campaign.get(ccSettingsKey) || !Object.keys(Campaign.get(ccSettingsKey)).includes('compendium') || !Campaign.attributes[ccStateKey]?.meta?.rootVersion >= CCH.ver.minSchema) {
			if (!window.is_gm) return occDialog.alertBox(`Fatal Error`, `The GM has not enabled a Custom Compendium for this game, or the GM has an out of date version.`);
			CCH.ccLog(`Creating new Compendium Settings Object....`);
			let defaultSettings = {
				compendium: 'default',
				allowPlayers: true
			}
			CCH.updateState(defaultSettings, 'root', ccSettingsKey);
		} else CCH.ccLog(Campaign.attributes[ccSettingsKey], 'info', `Loaded existing ccCampaign settings`);
		if (!Campaign.get(ccStateKey)) {
			occDialog.alertBox( 'Fatal Error', `Could not find or create Custom Compendium State, aborting...`, 'error');
			return;
		}
		if (!window.currentPlayer.get(ccSettingsKey)) {
			CCH.ccLog('', 'log', 'Creating new User settings...');
			let defaultSettings = {
				minimised: false,
				category: CCH5e.validate.category[0]||null,
				subCategory: 'all',
				position: null,
				positionMini: null,
				frameHeight: null,
			}
			window.currentPlayer.save(ccSettingsKey, defaultSettings);
		} else CCH.ccLog(window.currentPlayer.attributes[ccSettingsKey], 'info', `Loaded existing ccUser settings`);
		buildMenu();
	}

	// Build <select> items, categories and subcategories. Supply singleCategory to only return a single subcat select
	const buildCategoryDropdownsHTML = (singleCategory) => {
		let categoriesHTML = '';
		let subcategoriesHTML = '';
		let prevCat = CCH.settings('category') ? CCH.settings('category') : 'class';
		CCH5e.validate.combinedCategories().forEach(cat => {
			if (!singleCategory || cat === singleCategory) {
				let icon = CCH5e.validate.collectionCategory.includes(cat) ? '&copy;' : '';
				let defSelected = (cat === prevCat) ? ' selected' : '';
				categoriesHTML += `<option value="${cat}" ${defSelected}>${CCH.emproper(cat)} ${icon}</option>`;
				subcategoriesHTML += `<select id="oosh-cc-subcat-${cat}" class="oosh-cc toolbar data-select subcategory">
										<option value="all">All</option>`;
				CCH5e.validate.subCategory[cat].forEach(subCat => {
					subcategoriesHTML += `<option value="${subCat}">${CCH.emproper(subCat)}</option>`;
				});
				subcategoriesHTML += `</select>`;
			}
		});
		return [categoriesHTML, subcategoriesHTML];
	}

	// Build the main UI & controls
	const buildMenu = () => {

		let isGM = window.is_gm||false;
		let gmVisibility = isGM ? '' : ` data-isgm-visibility="false"`;
		let gmDisplay = isGM ? '' : ` data-isgm-display="false"`;

		// Build compendium names
		const buildCompendiumNames = () => {
			let HTML = '';
			let currentComp = CCH.settings('compendium')||'default';
			let compNames = Object.keys(Campaign?.attributes?.[ccStateKey]).filter(k=>k !== 'meta');
			if (!compNames.includes(currentComp)) { // if the active compendium was just deleted, change active compendium
				currentComp = compNames?.[0]||'';
				CCH.settings('compendium', currentComp);
			}
			compNames.forEach(n=>{
				let curSelect = (n === currentComp) ? 'selected' : '';
				HTML += `<option value="${n}" ${curSelect}>${CCH.emproper(n)}</option>`;
			});
			return HTML;
		}
		const refreshCompendiumList = (previousSelection) => {
			previousSelection = previousSelection ? previousSelection : CCH.settings('compendium');
			let newHTML = buildCompendiumNames();
			$('#oosh-cc-select-data').empty();
			$('#oosh-cc-select-data').append(newHTML);
			if (($('#oosh-cc-select-data').val() !== previousSelection) || Campaign.attributes[ccStateKey].length < 2) CCUI.refreshTable();
		}
		let compendiumNamesHTML = buildCompendiumNames();

		// Grab category/subcat <select> HTML
		let selectHTML = buildCategoryDropdownsHTML();

		// Build table structures for each validated category
		const flagIconsKey = `
			<span>CC Item Flag Icons:</span><br><br>
			<span><i class="fas fa-layer-group"></i> - Part of a Collection</span><br>
			<span><i class="fas fa-eye-slash"></i> - Hidden from players</span><br>
			<span><i class="fas fa-link"></i> - Linked entries:</span><br>
			<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;A - Linked attack</span><br>
			<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;H - Linked handout</span><br>
			<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;R - Linked resource</span><br>
		`;
		let tablesHTML = ``;
		CCH5e.validate.combinedCategories().forEach((c,i)=>{
			let headerRight = (i < CCH5e.validate.category.length) ? `` : `<button class="oosh-cc-add-collection" data-type="${c}" ${gmDisplay}><i class="fas fa-plus"></i><span> New</span></button>`;
			tablesHTML += `
				<div id="oosh-cc-${c}">
					<div id="oosh-cc-${c}-table" class="oosh-cc table">
						<div class="oosh-cc table-head">
							<div class="oosh-cc table-row">
								<div class="oosh-cc header-left">
									<span>${CCH.emproper(c)} Name</span>
									<div class="flag-icons-key">
										<i class="fas fa-key"></i>
									</div>
								</div>
								<div class="oosh-cc header-right">
									${headerRight}
								</div>
							</div>
						</div>
						<div id="oosh-cc-${c}-table-body">
						</div>
					</div>
				</div>`
		});

		// Main HTML
		const html = `
		<div class="oosh-cc" id="oosh-cc-frame">
			<div id="oosh-cc-header" class="oosh-cc header">
				<span id="oosh-cc-header-title">Custom Compendium</span>
				<button id="oosh-cc-minimise"><i class="fas fa-compress-arrows-alt"></i></button>
				<span id="oosh-cc-header-title-droppable"><i class="fab fa-dropbox"></i> accepting drop</span>
			</div>
			<div id="oosh-cc-body">
				<hr>
				<div id="oosh-cc-header-toolbar" data-isgm="${gmVisibility}">
					<div id="oosh-cc-current-compendium" ${gmDisplay}>
						<label for="oosh-cc-select-data" class="oosh-cc toolbar label">Current Compendium: </label>
						<div id="oosh-cc-current-compendium-controls">
							<select id="oosh-cc-select-data" class="oosh-cc toolbar data-select">
								${compendiumNamesHTML}
							</select>
							<button id="oosh-cc-compendium-new" class="oosh-cc toolbar button"><i class="fas fa-atlas"></i>New</button>
							<button id="oosh-cc-compendium-delete" class="oosh-cc toolbar button"><i class="fas fa-dizzy"></i>Delete</button>
						</div>
					</div>
					<hr${gmDisplay}>
					<div id="oosh-cc-import-export"${gmDisplay}>
						<button id="oosh-cc-import-start" class="oosh-cc toolbar button">Import</button>
							<input type="file" id="oosh-cc-import-file" class="oosh-cc toolbar input"/>
						<button id="oosh-cc-export-start" class="oosh-cc toolbar button">Export</button>
							<span class="oosh-cc toolbar label">save as .json</span>
					</div>
					<hr${gmDisplay}>
				</div>
				<div class="oosh-cc options">
					<div class="oosh-cc categories">
						<label for="oosh-cc-category-select" class="oosh-cc options label">Category: </label>
						<span class="oosh-cc options label">Subtype: </span>
						<span class="oosh-cc options label" ${gmVisibility}>Sheet Thief:</span>
						<select id="oosh-cc-category-select" class="oosh-cc toolbar data-select">${selectHTML[0]}</select>						
							${selectHTML[1]}
						<label class="oosh-cc switch" ${gmDisplay}><input id="oosh-cc-thief-mode" type="checkbox"><span class="slider round"></span></label>
					</div>
					<div class="oosh-cc search">
						<span><i class="fas fa-search"></i></span><input type="text" id="oosh-cc-search-bar" class="oosh-cc options search-bar" placeholder="Search..."/>
						<div class="oosh-cc search-clear"><i class="fas fa-times"></i></div>
					</div>
					<hr>
					<span class="oosh-cc-tooltip tt-flag-key">${flagIconsKey}</span>
				</div>
				<div class="oosh-cc table-section" id="oosh-cc-data">
					${tablesHTML}
				</div>
			</div>`;

		// Append HTML to document.body
		CCH.insertHTMLfromString(html, document.body, document.querySelector('#editor-wrapper'));
	
		// Make entire frame draggable
		let minMax = [-150, -10, 150, -100];
		CCH.dragElement($('#oosh-cc-frame')[0], $('#oosh-cc-header')[0], {saveSetting: 'position', axes: [2,1], boundingMinMax: minMax});

		// Create minimised icon
		//let vttesFlag = $('[title="Animated Background Setup (VTTES)"]').length > 0 ? true : false;
		let iconHTML = `
		<div class="oosh-cc minimised-icon" data-vttes="">
			<i class="fas fa-closed-captioning"></i>
		</div>`;
		CCH.insertHTMLfromString(iconHTML, document.body);
		// And make the mini draggable horizontally, disable contextmenu clicks
		let editorWrapperEdge = ($('#rightsidebar').prop('clientWidth') + $('.oosh-cc.minimised-icon').prop('clientWidth')) || 330;
		CCH.dragElement($('.oosh-cc.minimised-icon')[0], $('.oosh-cc.minimised-icon')[0], {saveSetting: 'positionMini', axes: [2,0], boundingMinMax: [0,0, -(editorWrapperEdge) ,0], mouseButtons: [1]});
		$('.oosh-cc.minimised-icon').on('contextmenu', (ev) => ev.preventDefault());
		// And then make the fucker clickable to restore main UI
		$('.oosh-cc.minimised-icon').on('mouseup', (ev) => {
			ev.preventDefault();
			CCH.ccLog(ev, 'info', 'Click Event');
			if (!$('.oosh-cc.minimised-icon').data('dragging')) {
				if (ev.which === 1) {
					$('#oosh-cc-frame').css('display', 'block');
					CCH.settings('minimised', false);
				// Double right-click to restore some main UI CSS if it gets lost at sea
				} else if (ev.which === 3 && ev.originalEvent.detail > 1) {
					$('#oosh-cc-frame').css({right: `${window.innerWidth/2}px`, top: `50px`, height: `600px`});
				}
			}
		});


		// EVENT LISTENERS
		// Titlebar Collapse
		document.getElementById('oosh-cc-header').addEventListener('dblclick', () => {
			let disp = $("#oosh-cc-body").css('display');
			if (disp !== 'none') {
				$("#oosh-cc-body").css({display: 'none'});
				$('#oosh-cc-frame').css({'max-height': '50px', 'min-height': '50px', resize: 'none!important'});
			} else {
				$("#oosh-cc-body").css({display: ''});
				$('#oosh-cc-frame').css({'max-height': '', 'min-height': '', resize: ''});
			}
		});

		// Header Minimise to Icon
		$('#oosh-cc-minimise').on('click', () => {
			//CCH.ccLog(`Hide clicked...`);
			$('.oosh-cc.minimised-icon').css('display', 'block');
			$('#oosh-cc-frame').css('display', 'none');
			CCH.settings('minimised', true);
			// Then hide the main UI
			$('#oosh-cc-frame').css('display', 'none');
		});

		// Restore previous settings for menu & icon
		if (CCH.settings('minimised')) $('#oosh-cc-frame').css({display: 'none'});
		let prevPos = CCH.settings('position'), prevMini = CCH.settings('positionMini');
		CCH.ccLog([prevPos, prevMini], 'log', `CSS position settings, main UI, mini icon`)
		if (prevPos) $('#oosh-cc-frame').css({top: prevPos[0], right: prevPos[1]});
		if (prevMini) $('.oosh-cc.minimised-icon').css({right: prevMini[1]});

		// New Compendium profile
		$('#oosh-cc-compendium-new').on('click', async () => {
			let rawName = await occDialog.textInput(`New Compendium`, 'Enter a name for the new Compendium (alpha-numeric only, must start with a letter):', 'Unique Compendium name...');
			let newName = rawName.toLowerCase().replace(/\s+/g, '_');
			CCH.ccLog([newName, rawName], 'info', `New Compendium name`);
			if (!/^[A-Za-z]/.test(newName)) {await occDialog.alertBox(`Error`, `Invalid name: first character must be a letter`, 'error'); return}
			if (!newName) return;
			let currentNames = Object.keys(Campaign.attributes[ccStateKey]);
			if (currentNames.includes(newName)) {await occDialog.alertBox(`Error`, `Invalid name: Compendium already exists`, 'error'); return}
			let newProfile = {version: CCH.ver.getVer(), schema: CCH.ver.schema};
			CCH.updateState({[newName]: newProfile}, 'root');
			await occDialog.alertBox(`Created Profile`, `New Profile created: ${newName}`, 'info');
			CCH.ccLog(CCH.getState(), 'info', 'Updated state object:');
			refreshCompendiumList(CCH.settings('compendium'));
		});
		// Delete Compendium profile
		$('#oosh-cc-compendium-delete').on('click', async () => {
			let deleteName = $('#oosh-cc-select-data').val();
			let confirmDelete = await occDialog.yesNo(`Delete Compendium`, `Are you sure you want to delete "${deleteName}"?`);
			if (!confirmDelete) return;
			let currentState = Campaign.get(ccStateKey);
			delete currentState[deleteName];
			CCH.updateState(currentState, 'root');
			await occDialog.alertBox(`Deleted Profile`, `Profile deleted: ${deleteName}`, 'info');
			CCH.ccLog(CCH.getState(), 'info', 'Updated state object:');
			refreshCompendiumList(CCH.settings('compendium'));
		});
		// Select Compendium profile
		$('#oosh-cc-select-data').on('change', (ev) => {
			let selectProfile = ev.originalEvent.target.value;
			if (Object.keys(Campaign.attributes[ccStateKey]).includes(selectProfile)) {
				CCH.settings('compendium', selectProfile);
				CCUI.refreshTable();
			} else occDialog.alertBox(`Error`, `Couldn't find ${selectProfile} in state object!`, 'error');
		});
		
		// Thief mode - dispatch Custom Event to alert sheet-scope functions
		document.getElementById('oosh-cc-thief-mode').addEventListener('change', (ev) => {
			document.getElementById('ccCustomEvents').dispatchEvent(new CustomEvent('toggleImportMode', {detail: {enabled: ev.target.checked||false}}));
		});
		// Category <select>
		document.getElementById(`oosh-cc-category-select`).addEventListener('change', (ev) => {
			let newVal = ev.target.value;
			let rxVal = new RegExp(`${newVal}`,'i');
			$('#oosh-cc-data').children().add('.oosh-cc.data-select.subcategory').each((i,el) => {
				el.style.display = (rxVal.test(el.id)) ? '' : 'none';
			});
			CCH.settings('category', newVal);
			CCUI.refreshTable(newVal);
		});
		// Subcategory filter
		$('.categories .oosh-cc.toolbar.data-select.subcategory').on('change', (ev) => {
			let currentSubCat = ev.originalEvent.target.value;
			CCH.settings('subCategory', currentSubCat);
			filterItems();
		});
		// Searchbar filter
		$('#oosh-cc-search-bar').on('input', () => {
			filterItems();
		});
		$('.oosh-cc.search-clear').on('click', () => {
			CCH.ccLog('clicky');
			$('#oosh-cc-search-bar').val('');
			filterItems();
		});
		// Function for seach/subcats
		const filterItems = () => {
			let rxSearch = $('#oosh-cc-search-bar').val() ? new RegExp(`${$('#oosh-cc-search-bar').val()}`, 'i') : null;
			let currentCat = CCH.settings('category');
			let currentSubCat = CCH.settings('subCategory');
			CCH.ccLog([rxSearch, currentCat, currentSubCat], 'info');
			$(`#oosh-cc-${currentCat}`).find('.oosh-cc-item, .oosh-cc-collection').each((i, el) => {
				if ( (currentSubCat === 'all' || $(el).data('itemsubcat') === currentSubCat)
					&& ( !rxSearch || rxSearch.test($(el).data('name'))) )
					$(el).parent().css({display:''});
				else $(el).parent().css({display:'none'});
			});
		}

		// Import from file
		document.querySelector(`#oosh-cc-import-start`).addEventListener('click', () => {
			let inputFile = document.querySelector(`#oosh-cc-import-file`).files?.[0]||null;
			if (!inputFile) alert(`No file selected!`);
			let rdr = new FileReader();
			rdr.onload = (ev) => {
				let importJSON;
				try {importJSON = JSON.parse(ev.target.result)}
				catch(err){CCH.ccLog(err, 'error')}
				if (!importJSON || !importJSON.meta) occDialog.alertBox(`Importer Error`, `Error importing JSON, see console for details`);
				CCH.ccLog(importJSON, 'info', `Read from JSON`);
				CCH.importStateFromFile(importJSON);
			}
			rdr.readAsText(inputFile);
		})

		// Export to file
		document.querySelector(`#oosh-cc-export-start`).addEventListener('click', () => {
			let campaignName = window.document?.title?.match(/([^|]+?)\|.*/)?.[1]?.trim()||'';
			let profileName = CCH.settings('compendium')||'Default';
			let filename = `Compendium - ${profileName} - ${campaignName}.json`;
			let currentState = JSON.stringify({
				meta: {
					schema_version: CCH.ver?.schema||0,
					occ_version: `${CCH.ver?.M}.${CCH.ver?.m}.${CCH.ver?.p}`||'0',
					datestamp: Date.now(),
					compendiumName: CCH.settings('compendium')||'default'
				},
				data: CCH.getState()||{}
			});
			let jsonBlob = new Blob([currentState], {type : 'application/json'});
			saveAs(jsonBlob, filename);
		});

		// Add Item button for Collections class items
		$('.oosh-cc-add-collection').on('click', async (ev) => {
			let type = ev.delegateTarget.dataset.type;
			let newName = await occDialog.textInput(`New ${CCH.emproper(type)}`, `Please enter a name for your new ${CCH.emproper(type)} item.`, `New Class`);
			if (!newName) return;
			let newCol = await customCompendium.newCollection(newName, type);
			await CCH.saveItemToState(newCol).then(res => {
				if (res) CCUI.refreshTable();
			});
		});

		// Dispatch events to restore previous session
		document.getElementById(`oosh-cc-category-select`).dispatchEvent(new Event('change'));
		// Restore frame height from previous session
		let restoreHeight = CCH.settings('frameHeight');
		if (restoreHeight) $('#oosh-cc-frame').css({height: restoreHeight});

		// Pass through to UI extension functions, drag & drop functions
		CCUI.initialiseTable();
	}

	setTimeout(() => occStartup(), 5000);

})();