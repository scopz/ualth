import { spawn } from 'child_process';
import { clipboard } from 'electron';
import fs from 'fs';
import { homedir } from 'os';
import { SaverConfig } from '../models/config.model';
import Command from './command';
import { SearchLevel, SearchResult } from '../../shared-models/models';

enum Action {
  CUSTOM = 0,
  DEFAULT,
  EDIT,
  RELOAD
}

interface DataFormat {
  action: Action,
  key?: string,
  value?: string
}

export default class SaverCommand extends Command {
  static label = 'infoSaver';

  static masterKey = 's';
  static fileName = '';

  action: Action;
  key?: string;
  content?: string;

  constructor(data: DataFormat) {
    super('SaverCommand');

    this.action = data.action;

    if (data.action === Action.CUSTOM) {
      this.keyWord = `${SaverCommand.masterKey} ${data.key}`;
      this.key = data.key;
      this.content = data.value;
      this.title = `Copy {i}${this.key}{/i}: {b}${this.content}{/b}`;

    } else {
      switch(data.action) {
        case Action.DEFAULT:
          this.keyWord = SaverCommand.masterKey;
          this.requiresParams = true;
          this.title = 'Save new database entry';
          break;

        case Action.EDIT:
          this.keyWord = `${SaverCommand.masterKey} edit`;
          this.title = 'Open database file';
          break;

        case Action.RELOAD:
          this.keyWord = `${SaverCommand.masterKey} reload`;
          this.title = 'Reloads database file';
          break;
        default: break;
      }
    }

    this.icon = 'database';
    this.generateId();
  }

  static override parseDefinitions(data: SaverConfig): DataFormat[] {
    SaverCommand.masterKey = data.key;
    SaverCommand.fileName = data.file.replace('~', homedir());

    const definitions = this.loadFile(SaverCommand.fileName);
    this.addDefaultActions(definitions);
    return definitions;
  }

  static addDefaultActions(definitions: DataFormat[]) {
    definitions.push({ action: Action.EDIT });
    definitions.push({ action: Action.RELOAD });
    definitions.push({ action: Action.DEFAULT });
  }

  override match(inputText: string): SearchResult {
    const match = super.match(inputText);
    if (match.level !== SearchLevel.NOT_FOUND && this.action === Action.DEFAULT) {
      const reservedWords = ['edit', 'reload'];
      const regex = new RegExp( `^${SaverCommand.masterKey} (${reservedWords.join('|')})($| )`, 'g' );
      return inputText.match(regex)
        ? { level: SearchLevel.NOT_FOUND }
        : match;
    }

    return match;
  }

  override perform(argsList: string[]) {
    const [ key, ...value ] = argsList;
    if (this.content) {
      clipboard.writeText(this.content);

    } else if (this.action === Action.EDIT) {
      spawn(this.cleanCommand('__DEFAULT_TEXT_EDITOR__'), [ SaverCommand.fileName ]);

    } else if (this.action === Action.RELOAD) {
      this.getCommands(commands => {
        const indexes = commands
          .map((c, i) => c instanceof SaverCommand? i : -1)
          .filter(i => i >= 0);

        const [ firstIndex ] = indexes;

        indexes
          .reverse()
          .forEach(i => commands.splice(i, 1));

        SaverCommand.parseDefinitions({key: SaverCommand.masterKey, file: SaverCommand.fileName})
          .map(data => new SaverCommand(data))
          .reverse()
          .forEach(command => commands.splice(firstIndex, 0, command));
      });

    } else if (this.action === Action.DEFAULT && value.length) {
      if (value.length === 1 && value[0] === '!') {
        this.getCommands(commands => {
          const saverCommands = commands
            .filter(c => c instanceof SaverCommand)
            .map(c => c as SaverCommand);

          const removeIndexSlice = saverCommands
            .findIndex(c => c.key == key);

          if (removeIndexSlice >= 0) {
            const removeIndex = commands.indexOf(saverCommands[removeIndexSlice]);

            commands.splice(removeIndex, 1);
            saverCommands.splice(removeIndexSlice, 1);

            this.saveFile(saverCommands);
          }

        });

      } else {
        const content = value
          .map(val => val.indexOf(' ') < 0 ? val : `"${val}"`)
          .join(' ');

        this.getCommands(commands => {
          const saverCommands = commands
            .filter(c => c instanceof SaverCommand)
            .map(c => c as SaverCommand);

          const [ existing ] = saverCommands
            .filter(c => c.key == key);

          if (existing) {
            existing.content = content;
            existing.title = `Copy {i}${existing.key}{/i}: {b}${content}{/b}`;

          } else {
            const addIndexSlice = (aux => {
              SaverCommand.addDefaultActions(aux);
              return saverCommands.length - aux.length;
            })([]);

            const addIndex = commands.indexOf(saverCommands[addIndexSlice]);

            const command = new SaverCommand({
              action: Action.CUSTOM,
              key, 
              value: content
            });

            commands.splice(addIndex, 0, command);
            saverCommands.splice(addIndexSlice, 0, command);
          }

          this.saveFile(saverCommands);
        });
      }
    }
  }

  static loadFile(fileName: string): DataFormat[] {
    if (fs.existsSync(fileName)) {
      return fs.readFileSync(fileName, 'utf-8')
        .split('\n')
        .reduce((red, line) => {
          if (!red.length || line.match(/(?!\\).=/)) {
            red.push(line);
          } else {
            const lastLine = red.splice(-1);
            red.push(`${lastLine}\n${line}`);
          }

          return red;
        }, [] as string[])
        .map(line => {
          const [ key, ...value] = line.split('=');
          return [key, value.join('=').replace(/\\\=/,'=')];
        })
        .map(([key, value]) => ({
          action: Action.CUSTOM,
          key,
          value
        }));
    }

    return [];
  }

  saveFile(commands: SaverCommand[]) {
    const content = commands
      .filter(command => command.content)
      .map(command => `${command.key}=${command.content!.replace(/\=/,'\\=')}`)
      .join('\n');

    fs.writeFile(SaverCommand.fileName, content, 'utf-8', err => {
      if (err) console.error(err);
    });
  }
}
