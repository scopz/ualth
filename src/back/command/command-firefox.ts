import { spawn } from "child_process";
import { shell } from "electron";
import { homedir } from "os";
import { FirefoxConfig } from "../models/config.model";
import fs from "fs";
import Command from "./command";
import { FirefoxBookmark } from "../models/firefox-bookmark.model";
import { search } from "../services/search-service";
import { SearchLevel, SearchResult } from "../../shared-models/models";

const jsonlz4 = require('jsonlz4-decompress');

const WIN_PATH = '~/AppData/Roaming/Mozilla/Firefox/Profiles/';
const LINUX_PATH = '~/.mozilla/firefox/';

interface ProfiledBookmark extends FirefoxBookmark {
  profile: string
}

export default class FirefoxCommand extends Command {
  static label = 'firefoxBookmarks';
  static path: string | undefined = '';

  url: string;
  profile: string;

  constructor(data: ProfiledBookmark) {
    super('FirefoxCommand');
    this.caseInsensitive = true;
    this.startsWith = false;

    this.title = data.title;
    this.keyWord = data.title;
    this.url = data.uri!;
    this.icon = data.iconUri || 'firefox';
    this.profile = data.profile;
    this.generateId();
  }

  static override parseDefinitions(data: FirefoxConfig): ProfiledBookmark[] {
    FirefoxCommand.path = data.path;

    const path = data.profileFolder || (process.platform === 'win32'? WIN_PATH : LINUX_PATH);
    const dir = path.replace('~', homedir());

    if (!fs.existsSync(dir)) {
      return [];
    }

    return fs.readdirSync(dir)
      .filter(profile => filterExcludes(profile, data.exclude))
      .filter(profile => fs.existsSync(`${dir}/${profile}/bookmarkbackups/`))
      .flatMap(profile =>
        fs.readdirSync(`${dir}/${profile}/bookmarkbackups/`)
          .sort()
          .slice(-1)
          .map(file => fs.readFileSync(`${dir}/${profile}/bookmarkbackups/${file}`))
          .flatMap(fileBuffer => recollect(jsonlz4(fileBuffer).children))
          .map(bookmark => ({ ...bookmark, profile: getProfileName(profile)} as ProfiledBookmark))
      )
      .filter(bookmark => bookmark.title);
  }

  override match(inputText: string): SearchResult {
    const keyLevel = search(this.keyWord, inputText, true)
    return keyLevel.level === SearchLevel.NOT_FOUND
      ? search(this.url, inputText, true, false, false)
      : keyLevel;
  }

  override perform() {
    if (FirefoxCommand.path) {
      spawn(FirefoxCommand.path, ['-p', this.profile, this.url], { detached: true });
    } else {
      shell.openExternal(this.url);
    }
  }
}

function recollect(json: FirefoxBookmark[]): FirefoxBookmark[] {
  return [
    ...json.filter(j => j.type === 'text/x-moz-place'),
    ...json.filter(j => j.children).flatMap(j => recollect(j.children!))
  ];
}

function filterExcludes(profile: string, excludes: string[] = []) {
  if (excludes.length) {
    return excludes.indexOf(getProfileName(profile)) < 0;
  }
  return true;
}

function getProfileName(profile: string) {
  const [ _, ...name ] = profile.split('.');
  return name.join('.');
}
