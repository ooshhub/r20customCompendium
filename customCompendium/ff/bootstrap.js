/* globals chrome, browser */
//console.clear();

const ccGameSystem = 'roll20_5e';

const ccExtensionName = 'r20-custom-compendium';
const ccVersion = '0.1.0';

let ccRunOnce = false;

const consoleStyle = {
	std: `border: solid 1px orange; line-height: 24px; text-align: middle; padding: 3px; border-radius: 8px`,
}
console.log(`-== ${ccExtensionName} ==-`,'\n',`v${ccVersion}`);

if (document.getElementById(ccExtensionName)) document.head.removeChild(ccExtensionName);

const scriptBlock = document.createElement("div");
scriptBlock.id = ccExtensionName;

const createScript = (filename) => {
    let script = document.createElement("script");
    let br = chrome || browser;
    script.src = br.extension.getURL(filename);
    script.type = 'text/javascript';
    script.onload = () => { script.remove(); };
	scriptBlock.appendChild(script);
	console.log(`  injecting ${filename}...`)
}

const loadScripts = () => {
    let docHead = document.head || document.getElementsByTagName('head')[0];
	createScript(`Scripts/helpers.js`);
	createScript(`Scripts/classes.js`);
    createScript("Scripts/extendUI.js");
	createScript(`Systems/${ccGameSystem}/customCompendium5e.js`);
	createScript(`Systems/${ccGameSystem}/helpers5e.js`);
	createScript(`Scripts/menu.js`);
	createScript(`Utils/FileSaver.js`);
	createScript(`Utils/occCC.js`);
	console.log('==================', '\n', 'Appending scriptblock...');
	docHead.appendChild(scriptBlock);
}

// Initialise
const init = () => {
	if (ccRunOnce) return;
	//console.clear();
	console.info(`%c=== Starting customCompendium load ===`, consoleStyle.std);
	console.log(`Loading scripts...`, '\n', '==================');
	loadScripts();
	ccRunOnce = true;
}
// Make sure scripts unload for a page refresh
document.body.addEventListener("beforeunload", () => {
    document.getElementById(ccExtensionName).remove();
});
// Inject scripts if ready, otherwise add a handler
if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener("load", init);
}

// Set up listener for custom events
let msgDiv = document.createElement('div');
msgDiv.dataset.gameSystem = ccGameSystem;
msgDiv.id = `ccCustomEvents`;
msgDiv.style = `display:none`;
let target = document.body;
target.appendChild(msgDiv);

// Character sheet script header injection
let injectRunning = false;
document.getElementById('ccCustomEvents').addEventListener('customInject', (event) => {
	console.log(event);
	if (injectRunning) return;
	injectRunning = true;
	event.preventDefault();
	event.stopPropagation();
	//console.log(`%cEvent triggered, attempting to inject...`, consoleStyle.std);
	let targetDocument = event.detail.target;
	//console.log(targetDocument);
	let charBlock = document.createElement("div");
	charBlock.id = "oosh-cc-char-injector";

	const createScript = (source) => {
		let script = document.createElement("script");
		let br = chrome || browser;
		script.src = br.extension.getURL(source);
		script.type = 'text/javascript';
		//script.onload = () => { script.remove(); };
		charBlock.appendChild(script);
		console.log(`  injecting script ${source}...`);
	}
	const loadScripts = () => {
		let charHead = targetDocument.head || targetDocument.getElementsByTagName('head')[0];
		createScript(`Systems/${ccGameSystem}/sheetFluffer5e.js`);
		charHead.appendChild(charBlock);
		setTimeout(() => injectRunning = false, 10000);
		console.log(`%cCS Injection Complete`);
	}
	loadScripts();
});