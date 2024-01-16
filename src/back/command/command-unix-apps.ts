import { homedir } from "os";
import fs from "fs";
import path from "path";
import Command from "./command";
import { paramsSplitter } from "../common";


import { spawn, SpawnOptionsWithoutStdio } from "child_process";
import { SearchLevel, SearchResult } from "../../shared-models/models";
import { search } from "../services/search-service";


interface Application {
  name: string;
  icon?: string;
  exec: string;
  keywords: string[];
}

interface DesktopI {
  Name: string;
  Exec: string;
  Icon?: string;
  GenericName?: string;
  Keywords?: string;
  NoDisplay?: 'true' | 'false';
}

export default class UnixAppsCommand extends Command {
  static label = 'unixApps';

  exec = '';
  keywords: string[];

  constructor(data: Application) {
    super('UnixAppsCommand');

    this.caseInsensitive = true;
    this.startsWith = false;

    this.keywords = data.keywords;
    this.keyWord = data.name;
    this.title = data.name;
    this.icon = 'exec';
    this.exec = data.exec;
    this.generateId();
  }

  static override parseDefinitions(data: string): Application[] {
    if (process.platform === 'win32') {
      return [];
    }

    const dir = data.replace('~', homedir());

    if (!fs.existsSync(dir)) {
      return [];
    }
    
    return getAllApplications(dir)
      .flatMap(readApplication)
      .filter(app => app.name && app.exec);
  }

  override match(inputText: string): SearchResult {
    const result = super.match(inputText);

    if (!this.keywords.length || result.level !== SearchLevel.NOT_FOUND) {
      return result;
    }

    for(const word of this.keywords) {
      const subResult = search(word, inputText, true, false, false);
      if (subResult.level !== SearchLevel.NOT_FOUND) {
        return subResult;
      }
    }

    return result;
  }

  override perform() {
    const options: SpawnOptionsWithoutStdio = {
      detached: true,
      cwd: homedir()
    };

    const [ command, ...paramsArray ] = this.exec.split(' ');
    const params = paramsArray.join(' ')
      .replace(/%[Dd]/g, `"${options.cwd}"`)
      .replace(/%[FfUuki]/g, '');

    spawn(command, paramsSplitter(params), options);
  }
}

function getAllApplications(dir: string): string[] {
  return fs.readdirSync(dir)
    .flatMap(file => {
      const subDir = path.join(dir, file);
      const stat = fs.statSync(subDir);
      return stat.isDirectory()
        ? getAllApplications(subDir)
        : [ subDir ];
    })
    .filter(file => file.endsWith('.desktop'));
}

function readApplication(dir: string): Application[] {
  return fs.readFileSync(dir, 'utf8')
    .split('[Desktop Action ')
    .filter(content => content.indexOf('[Desktop Entry]') >= 0)
    .map(body => body.trim())
    .filter(Boolean)
    .filter(line => line != '[Desktop Entry]')
    .map(appData => appData.split('\n'))
    .map<DesktopI>(appData =>
      appData.reduce((content, line) => {
        const [ key, ...value ] = line.split('=');
        content[key] = value.join('=');
        return content;
      }, {} as any)
    )
    .filter(appData => appData.NoDisplay != 'true')
    .map(appData => {
      const keywords = [
        appData.GenericName,
        ... (appData.Keywords?.split(';').map(s => s.trim()) ?? [])
      ].filter(Boolean) as string[];

      return {
        name: appData.Name,
        exec: appData.Exec,
        icon: appData.Icon,
        keywords
      }
    });
}