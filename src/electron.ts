import { app, BrowserWindow, ipcMain, globalShortcut, dialog, screen } from 'electron';
import { join } from 'path';
import isDev from 'electron-is-dev';
// TODO: include the dev tools installer to load React Dev Tools?
//import { default as installExtension, REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

import { config, error as loadError }  from './back/config-load';

//const { config : { defaultHotkey }, error: loadError } = require('./back/config-load');
import { perform, match, resolve, historyString, removeHistory } from './back/action-performer';

const DIMENSIONS = [800, 50];

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require("electron-squirrel-startup")) {
	app.quit();
}

function createWindow(): BrowserWindow {
	// Create the browser window.
	const win = new BrowserWindow({
		width: DIMENSIONS[0],
		height: DIMENSIONS[1],
		frame: false,
		resizable: false,
		center: (config?.style?.left ?? -1) < 0,
		alwaysOnTop: true,
		skipTaskbar: true,
		autoHideMenuBar: true,
		movable: false,
		transparent: true,
		webPreferences: {
			nodeIntegration: false, // is default value after Electron v5
			contextIsolation: true, // protect against prototype pollution
			//enableRemoteModule: false, // turn off remote
			preload: join(__dirname, './bridge.js') // use bridge as a preload script
		}
	});

	// needed in some linux distributions
	win.setSkipTaskbar(true);
	win.setAlwaysOnTop(true);

	// and load the index.html of the app.
	win.loadURL(
		isDev
			? "http://localhost:3000"
			: `file://${join(__dirname, "../build/index.html")}`
	);

	//if (isDev) {
	//	win.webContents.openDevTools({ mode: "detach" });
	//}

	return win;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

	if (loadError) {
		dialog.showErrorBox('An error occurred and the app will close', loadError.stack ?? '');
		app.quit();
		return;
	}

	const win = createWindow();
	win.minimize();
	win.hide();

	globalShortcut.register(config?.defaultHotkey ?? 'Alt+Space', () => {
		win.show();
		win.webContents.send('show');

		setTimeout(() => {
			const winBounds = win.getBounds();
			const primaryDisplay = screen.getDisplayNearestPoint({x: winBounds.x, y: winBounds.y});

			const width = DIMENSIONS[0] = (config?.style?.width ?? 800) < 0
				? primaryDisplay.bounds.width
				: (config?.style?.width ?? 800);
	
			const x = (config?.style?.left ?? -1) < 0
				? (primaryDisplay.bounds.width - DIMENSIONS[0]) / 2 
				: config?.style?.left ?? 0;
	
			const y = (config?.style?.top ?? -1) < 0
				? (primaryDisplay.bounds.height - DIMENSIONS[1]) / 2 - 200
				: config?.style?.top ?? 0;
	
			win.setBounds({ width, height: DIMENSIONS[1] });
			win.setPosition(primaryDisplay.bounds.x + x, primaryDisplay.bounds.y + y);
		}, 10);
	});

	win.on('blur', () => win.webContents.send('blur'));

	ipcMain.on('hide',          (event) => { win.minimize(); win.hide(); });
	ipcMain.on('height',        (event, arg) => win.setBounds({ width: DIMENSIONS[0], height: arg }));
	ipcMain.on('removeHistory', (event, arg) => removeHistory(arg));
	ipcMain.on('perform',       (event, arg, params) => event.returnValue = perform(arg, params));
	ipcMain.on('resolve',       (event, arg) => event.returnValue = resolve(arg));
	ipcMain.on('find',          (event, arg) => event.returnValue = match(arg));
	ipcMain.on('history',       (event, arg) => event.returnValue = historyString(arg));
	ipcMain.on('styleConfig',   (event, arg) => event.returnValue = config?.style ?? {});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	app.quit();
});
