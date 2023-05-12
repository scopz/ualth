import Config from '../models/config.model';
import md5 from 'md5';
import { search } from '../services/search-service';
import { SearchLevel, SearchResult } from '../../shared-models/models';

export default class Command {

  static config: Config;
  static commands: Command[];

  static setParams(config: Config, commands: Command[]) {
    Command.config = config;
    Command.commands = commands;
  }

  //keyName: string;
  keyWord = '';
  title = '';
  icon = '';
  command = '';
  
  requiresParams = false;
  caseInsensitive = false;
  startsWith = true;
  
  id?: string = undefined;

  constructor(public keyName: string) {
    //this.id = Math.random().toString().substring(2);
  }

  getCommands(funct: (commands: Command[]) => void) {
    funct(Command.commands);
  }

  generateId() {
    if (!this.id) {
      this.id = md5(this.keyName+this.keyWord);
    }
  }

  static parseDefinitions(data: any): any {
    return [ data ];
  }

  match(inputText: string): SearchResult {
    if (!inputText.length) {
      return { level: SearchLevel.NOT_FOUND };
    }

    let value = inputText;

    if (this.requiresParams) {
      const split = inputText.split(' ');
      if (split.length > 1 && this.keyWord != split[0]) {
        return { level: SearchLevel.NOT_FOUND };
      }
      value = split[0];
    }

    if (this.startsWith) {
      const searchResult = search(this.keyWord, value, this.caseInsensitive, false, this.title === this.keyWord);
      return searchResult.level === SearchLevel.STARTING
        ? searchResult
        : { level: SearchLevel.NOT_FOUND };
    }
    
    return search(this.keyWord, value, true, true, this.title === this.keyWord);
  }

  cleanCommand(command: string): string {
    if (command === '__DEFAULT__')             return Command.config.default.command;
    if (command === '__DEFAULT_TEXT_EDITOR__') return Command.config.default.textEditorCommand;
    return command;
  }

  perform(argsList?: string[]) {}
}
