const Command = require('./command');
const { shell } = require('electron');

class SearchEngineCommand extends Command {
	static label = 'searchEngines';

	constructor(data) {
		super();

		this.keyword = data.key;
		this.title = data.title;
		this.url = data.url;
		this.rootUrl = data.rootUrl;
		this.requiresParams = true;
		this.icon = data.icon || 'search-engine';
	}

	match(inputText) {
		const [ keyword ] = this.keyword.split(' ');
		const [ value, params ] = inputText.split(' ');

		return params === undefined
			? keyword.indexOf(value) === 0
			: keyword === value;
	}

	perform(argsList) {
		if (this.rootUrl && !argsList.length) {
			shell.openExternal(this.rootUrl);	

		} else {
			const queryValue = encodeURIComponent(argsList.join(' '));
			const result = this.url.replace('{q}', queryValue);
			shell.openExternal(result);
		}
	}
}

module.exports = SearchEngineCommand;