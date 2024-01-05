import React from 'react';
import ReactDOM from 'react-dom';
import App from './front/app';
import { StyleConfig } from './shared-models/models';
import { setNumVisibleItems } from './front/constants-conf';

ReactDOM.render(
	<App />,
	document.getElementById('root')
);


const setStyle = (key: string, value: string) => document.documentElement.style.setProperty(`--${key}`, value);
const styles = window.ipcRenderer.sendSync<StyleConfig>('styleConfig');
if (styles.radius !== undefined) setStyle('radius', `${styles.radius}px`);
if (styles.background)           setStyle('background', styles.background);
if (styles.selected)             setStyle('selected', styles.selected);

if (styles.results)              setNumVisibleItems(styles.results);