import { shell } from "electron";
import { SearchEngineConfig, SearchEngineConfigElement } from "../models/config.model";
import Command from "./command";
import { search } from '../services/search-service';
import { SearchLevel, SearchResult } from '../../shared-models/models';
import { spawn } from "child_process";

type Spawner = (url: string) => void;

export default class SearchEngineCommand extends Command {
  static label = 'searchEngines';
  static spawner: Spawner = (url: string) => shell.openExternal(url);

  url: string;
  rootUrl?: string;

  constructor(data: SearchEngineConfigElement) {
    super('SearchEngineCommand');

    this.keyWord = data.key;
    this.title = data.title ?? data.key;
    this.url = data.url;
    this.rootUrl = data.rootUrl;
    this.requiresParams = true;
    this.icon = data.icon || 'search-engine';
    this.generateId();
  }

  static override parseDefinitions(data: SearchEngineConfig) {
    const program = data.use;
    if (program)
      SearchEngineCommand.spawner = url => spawn(program, [url], { detached: true });

    return data.engines;
  }

  override match(inputText: string): SearchResult {
    const [ keyword ] = this.keyWord.split(' ');
    const [ value, params ] = inputText.split(' ');

    if (params === undefined) {
      const searchResult = search(keyword, value, false, false, false);
      if (searchResult.level === SearchLevel.STARTING) {
        return searchResult;
      }
    } else if (keyword === value) {
      return {
        level: SearchLevel.STARTING,
        matchingIndexes: [],
      };
    }

    return { level: SearchLevel.NOT_FOUND };
  }

  override perform(argsList: string[]) {

    if (this.rootUrl && !argsList.length) {
      SearchEngineCommand.spawner(this.rootUrl)

    } else {
      const param = argsList.join(' ');
      const queryValue = encodeURIComponent(param);

      const result = this.url
        .replace('{q}', queryValue)
        .replace('{q:d}', param)
        .replace('{q:e}', encodeURIComponent(queryValue));

      SearchEngineCommand.spawner(result);
    }
  }
}
