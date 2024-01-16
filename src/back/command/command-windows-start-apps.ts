import { homedir } from "os";
import fs from "fs";
import Command from "./command";

import path from "path";
import { shell } from "electron";

export default class WindowsStartAppsCommand extends Command {
  static label = 'windowsApps';

  fullPath = '';

  constructor(lnkPath: string) {
    super('WindowsStartAppsCommand');

    this.caseInsensitive = true;
    this.startsWith = false;

    const fileName = path.basename(lnkPath, path.extname(lnkPath));

    this.keyWord = fileName;
    this.title = fileName;
    this.icon = 'exec';
    this.fullPath = lnkPath;
    this.generateId();
  }

  static override parseDefinitions(data: string): string[] {
    if (process.platform !== 'win32') {
      return [];
    }

    const dir = ((path) => {
      if (path.match(/%appdata%/i)) {
        const appData = process.env.AppData;
        if (!appData) {
          return undefined;
        }
        return path.replace(/%appdata%/i, appData);
      }
      return path;
    })(data.replace('~', homedir()));

    if (!dir || !fs.existsSync(dir)) {
      return [];
    }

    return keepUnique(getAllLinks(dir));
  }

  override perform() {
    shell.openPath(this.fullPath);    
  }
}

export function getAllLinks(dir: string): string[] {
  return fs.readdirSync(dir)
    .flatMap(file => {
      const subDir = path.join(dir, file);
      const stat = fs.statSync(subDir);
      return stat.isDirectory()
        ? getAllLinks(subDir)
        : [ subDir ];
    })
    .filter(file => file.endsWith('.lnk'));
}

function keepUnique(dirs: string[]): string[] {
  const fileNames: string[] = [];

  return dirs.filter(dir => {
    const fileName = path.basename(dir);
    if (fileNames.indexOf(fileName) >= 0) {
      return false;
    } else {
      fileNames.push(fileName);
      return true;
    }
  });
}