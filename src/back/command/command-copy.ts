import { CopyConfig } from "../models/config.model";
import { clipboard } from 'electron';
import Command from "./command";

export default class CopyCommand extends Command {
  static label = 'copy';

  constructor(data: CopyConfig) {
    super('CopyCommand');

    this.title = 'Copy parameters into clipboard';
    this.requiresParams = true;
    this.keyWord = data.key;

    this.icon = 'ualth';
    this.generateId();
  }

  override perform(argsList: string[]) {
    if (argsList.length) {
      const value = argsList.join(' ');
      clipboard.writeText(value);
    }
  }
}
