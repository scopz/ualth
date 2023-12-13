import fs from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import Command from '../command/command';
import { commands } from '../config-load';
import { HistoricSearchResult, SearchLevel, HistoryElement } from '../../shared-models/models';

const HISTORIC_PATH = join(homedir(), '.ualthhi');
const MAX_HISTORY = 10000;

if (!fs.existsSync(HISTORIC_PATH)) {
  fs.closeSync(fs.openSync(HISTORIC_PATH, 'w'));
}

const historic: HistoryElement[] = (fileName => {
  if (fs.existsSync(fileName)) {

    return fs.readFileSync(fileName, 'utf-8')
      .split(/\r\n|\n/)
      .filter(notEmptyLine => notEmptyLine)
      .reduce((list, line) => {
        const matches = `${line}`.match(/^([10]):([^\s]+?):(.*)$/);
        if (matches && matches.length === 4) {
          list.push({
            visible: matches[1] === '1',
            commandId: matches[2],
            inputText: matches[3]
          });
        }
        return list;
      }, [] as HistoryElement[]);
  }
  return [];
})(HISTORIC_PATH);

export function searchHistory(input: string): HistoricSearchResult[] {
  return historic
    .map<HistoricSearchResult>((historicElement, idx) => ({
      command: commands.find(command => command.id === historicElement.commandId),
      input: historicElement.inputText,
      priority: idx
    }))
    .filter(result => result.command)
    .map(result => {
      result.searchResult = result.command?.match(input);
      return result;
    })
    .filter(result => result.searchResult?.level !== SearchLevel.NOT_FOUND);
}

export function getHistoryString(index: number): HistoryElement | undefined {

  const visibleHistoric = historic.filter(historicElement => historicElement.visible).reverse();

  return index < visibleHistoric.length ? visibleHistoric[index] : undefined;
}

export function removeHistoryByIndex(index: number) {

  const visibleHistoric = historic.filter(historicElement => historicElement.visible).reverse();

  if (index < visibleHistoric.length && index >= 0) {
    visibleHistoric[index].visible = false;
    saveFile();
  }
}

export function saveHistory(command: Command, input: string): void {

  historic
    .map((historicElement, index) => {
      if (historicElement.commandId !== command.id) {
        return -1;
      }

      return !historicElement.visible || (command.requiresParams ? historicElement.inputText === input : true)
        ? index
        : -1
    })
    .filter(index => index >= 0)
    .reverse()
    .forEach(index => historic.splice(index, 1));

  historic.push({
    visible: true,
    commandId: command.id!,
    inputText: input
  });

  if (historic.length > MAX_HISTORY) {
    historic.splice(0, historic.length - MAX_HISTORY);
  }

  saveFile();
}

function saveFile(): void {
  const content = historic
    .map(historicElement => `${historicElement.visible?'1':'0'}:${historicElement.commandId}:${historicElement.inputText}`)
    .join('\n');

  fs.writeFile(HISTORIC_PATH, content, 'utf-8', err => {
    if (err) console.error(err);
  });
}
