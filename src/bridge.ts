import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
	'ipcRenderer', {
		send: (channel: string, ...data: any[]) => {
			const validChannels = ['hide', 'height'];
			if (validChannels.includes(channel)) {
				ipcRenderer.send(channel, ...data);
			}
		},
		sendSync: (channel: string, ...data: any[]) => {
			const validChannels = ['find', 'perform', 'resolve'];
			if (validChannels.includes(channel)) {
				return ipcRenderer.sendSync(channel, ...data);
			}
		},
		receive: (channel: string, func: (...args: any[]) => void) => {
			const validChannels = ['show', 'blur'];
			if (validChannels.includes(channel)) {
				// Deliberately strip event as it includes `sender` 
				ipcRenderer.on(channel, (event, ...args) => func(...args));
			}
		}
	}
);