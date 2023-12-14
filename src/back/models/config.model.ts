export interface DefaultConfig {
  command: string,            // execute program
  textEditorCommand: string   // program to open text files with
}

export interface InternalCommandsConfig {
  exit: string,
  reload: string,
}

export interface HashConfig {
  key: string,
  seed: number
}

export interface SaverConfig {
  key: string,
  file: string
}

export interface CopyConfig {
  key: string
}

export interface FirefoxConfig {
  profileFolder?: string,
  path?: string,
  exclude?: string[]
}

export interface ChromeConfig {
  bookmarkFile: string,
  path: string
}

export interface SearchEngineConfig {
  use?: string,
  engines: SearchEngineConfigElement[]
}
export interface SearchEngineConfigElement {
  key: string,
  title?: string,
  url: string,
  rootUrl?: string,
  icon?: string,
}

export interface CommandRunConfig {
  key: string,
  command: string,
  arguments?: string,
  noParams?: {
    command: string,
    arguments?: string,
  }
  workingDir: string,
  icon?: string,
}

export default interface Config {
  defaultHotkey: string,
  default: DefaultConfig,
  resolve: Record<string, string>,
  internalCommands: InternalCommandsConfig,
  hash?: HashConfig,
  infoSaver?: SaverConfig,
  copy?: CopyConfig,
  unixApps?: string[],
  firefoxBookmarks?: FirefoxConfig,
  chromeBookmarks?: ChromeConfig,
  searchEngines?: SearchEngineConfig[],
  runner: CommandRunConfig[]
}
