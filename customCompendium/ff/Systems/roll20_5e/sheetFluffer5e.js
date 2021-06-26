/* globals $,  */
const ccCharInjection = (() => { //eslint-disable-line no-unused-vars
	
	// Helper scripts are not available inside the iframe, so need the logging function again
    const consoleStyle = {
        scriptName: 'oCC',
        log: `border: solid 1px cyan; line-height: 16px; text-align: center; padding: 1px 8px 2px 8px; border-radius: 8px; background-color: #333`,
        info: `border: solid 2px orange; line-height: 16px; text-align: middle; padding: 1px 8px 2px 8px; border-radius: 8px; background-color: #444`,
        warn: `border: solid 2px red; line-height: 16px; text-align: middle; padding: 1px 8px 2px 8px; border-radius: 8px; background-color: #444`,
        error: `border: solid 2px red; line-height: 16px; color: red; font-weight: bold; text-align: middle; padding: 1px 8px 2px 8px; border-radius: 8px; background-color: #fff` }
    const ccLog = (msg, style='log', ...msgs) => { // use rest parameter if more than one msg object required
        style = Object.keys(consoleStyle).includes(style) ? style : 'log';
        console.log(`%c${consoleStyle.scriptName}.${style}`, consoleStyle[style], msg, ...msgs);
        if (style === 'error') console.trace();}

	const payload = () => {
		// Repeating section setup for 5e sheet:
		const getSheetSections = () => {
			let repeating = {
				attacks: {
					disableJQDraggable: $('.repcontainer[data-groupname="repeating_attack"] .display').find('.btn.ui-draggable, .btn.ui-draggable input'),
					enableHTMLDraggable: $('.repcontainer[data-groupname="repeating_attack"] .display'),
					applyCSS: $('.repcontainer[data-groupname="repeating_attack"] .display').find('.btn.ui-draggable, .btn.ui-draggable input'),
				},
				traits: {
					disableJQDraggable: $('[data-groupname="repeating_traits"] .trait'),
					enableHTMLDraggable: $('[data-groupname="repeating_traits"] .display'),
					applyCSS: $('[data-groupname="repeating_traits"] .title'),
				},
				inventory: {
					disableJQDraggable: null,
					enableHTMLDraggable: $('[data-groupname="repeating_inventory"] .item'),
					applyCSS: $('[data-groupname="repeating_inventory"] .item input'),
				},
				spells: {
					disableJQDraggable: $('[name="roll_spell"]'),
					enableHTMLDraggable: $('.page.spells .spell-container .display'),
					applyCSS: $('.page.spells .spell-container .spellname'),
				},
				proficienciesTools: {
					disableJQDraggable: $(`[name="roll_tool"]`),
					enableHTMLDraggable: $(`[data-groupname="repeating_tool"] .display`),
					applyCSS: $(`[data-groupname="repeating_tool"] .tool .display *`),
				},
				proficienciesLaunguages: {
					disableJQDraggable: $(`[data-groupname="repeating_proficiencies"] [name="roll_output"]`),
					enableHTMLDraggable: $(`[data-groupname="repeating_proficiencies"] .display`),
					applyCSS: $(`[data-groupname="repeating_proficiencies"] .display span`),
				}
			}
			// Merge into one JQ object per task
			let targetElements = {
				disableJQDraggable: {},
				enableHTMLDraggable: {},
				applyCSS: {},
			}
			const mergeRepSecJQ = (outputObj, inputObj) => {
				let taskKeys = Object.keys(outputObj);
				for (let sec in inputObj) {
					taskKeys.forEach(task => {
						if (inputObj[sec][task]) {
							outputObj[task] = $(outputObj[task]).add($(inputObj[sec][task]));
						}
					});
				}
			}
			mergeRepSecJQ(targetElements, repeating);
			return targetElements;
		}

		// HTML5 drag to apply to repeating section entries
		const ccDrag = (jqEv) => {
			let ev = jqEv.originalEvent;
			//ccLog('HTML Drag starts...', ev);
			ev.dataTransfer.effectAllowed = "copy";
			let dragData = {
				repeatingGroup: ev.target.closest('.repcontainer')?.dataset?.groupname||null,
				repeatingId: ev.target.closest('.repitem')?.dataset?.reprowid||null,
				characterId: ev.target.baseURI.match(/-[A-Za-z0-9_-]{19}/)?.[0]||null
			}
			ev.dataTransfer.setData("text", JSON.stringify(dragData));
			parent.$(".characterdialog iframe").css({'pointer-events': "none", 'background-color': 'blue'});
			parent.document.getElementById('oosh-cc-header-title').style.display = 'none';
			parent.document.getElementById('oosh-cc-minimise').style.display = 'none';
			parent.document.getElementById('oosh-cc-header-title-droppable').style.display = 'inline-block';
			parent.document.getElementById('oosh-cc-header').style = `border: 3px dashed black; background:white; color: black; text-align:center;`;
		}
		const ccDragEnd = () => {
			parent.$(".characterdialog iframe").css({'pointer-events': "auto", 'background-color': ''});
			parent.document.getElementById('oosh-cc-header-title').style.display = '';
			parent.document.getElementById('oosh-cc-minimise').style.display = '';
			parent.document.getElementById('oosh-cc-header-title-droppable').style.display = 'none';
			parent.document.getElementById('oosh-cc-header').style = '';
			//ev.target.removeClass('dragging');
		}

		// Toggle thief mode, which allows user to copy Repeating Items from Character sheet to Extension UI
		let targetElements;
		const toggleImport = (enabled) => {		
			if (enabled) {
				targetElements = getSheetSections();
				ccLog(`Thief mode toggled ON for ${charName}`, 'info', targetElements);
				// Disable the sheet's JQ Draggable functions.
				$(targetElements.disableJQDraggable).each((i, el) => {
					if ($(el).data('ui-draggable')) {
						$(el).draggable('disable')
							.removeClass('ui-draggable-disabled ui-state-disabled')
					}
					$(el).css('pointer-events', 'none'); // NEW LINE HERE
				});
				// CSS from Extension file is not being applied to iframe... so apply directly to elements:
				$(targetElements.applyCSS).css({'pointer-events': 'none', color: 'blue'});
				// and finally, add the HTML drag functions to the target divs
				$(targetElements.enableHTMLDraggable).on('dragstart', (ev) => ccDrag(ev))
					.on('dragend', (ev) => ccDragEnd(ev))
					.prop('draggable', 'true')
					.css('pointer-events', 'all'); // Ensure mouse pointer events are enabled
			} else {
				if (!targetElements) return;
				ccLog(`Thief mode toggled OFF for ${charName}`);
				$(targetElements.disableJQDraggable).each((i, el) => {
					if ($(el).data('ui-draggable')) {
						$(el).draggable('enable')
							.removeClass('oosh-cc-reverse-draggable')
					}
					$(el).css('pointer-events', ''); // NEW LINE HERE
				});
				$(targetElements.applyCSS).css({'pointer-events': '', color: ''});
				$(targetElements.enableHTMLDraggable).off('dragstart', (ev) => ccDrag(ev))
				.off('dragend', (ev) => ccDragEnd(ev))
				.prop('draggable', 'true')
				.css('pointer-events', '');
			}
		}
		
		parent.document.getElementById('ccCustomEvents').addEventListener('toggleImportMode', (ev) => {
			toggleImport(ev.detail.enabled);
		});
		let toggleState = parent.document.querySelector('#oosh-cc-thief-mode').checked
		let charName = $('.page.core [name="attr_character_name"]').val()||'sheet';
		if (toggleState) toggleImport(true); // Check Thief state on Init, run toggler if state is true
	}

	let loadDrag = setInterval(() => {
		let x;
		try{x = $('.btn[name="roll_strength"]').draggable('option')}catch(err){ccLog(err)}
		if (x) {
			ccLog(`Script injection successful, running sheet listeners...`, 'info');
			clearInterval(loadDrag);
			payload();
		}
	}, 1000)
	
})();