import React from 'react';
import InputLauncher from './launcher-input';
import ItemList from './item-list';
import { classNames } from './support';
import { getNumVisibleItems, INPUT_HEIGHT, ITEM_HEIGHT } from './constants-conf';
import './app.css';
import { Command, PriorizedSearchResult } from '../shared-models/models';

const ipcRenderer = window.ipcRenderer;

interface AppProperties { }

interface AppState {
  visible: boolean,
  results: PriorizedSearchResult[],
  resultSelected: number,
}

export default class App extends React.Component<AppProperties, AppState> {
  constructor(props: AppProperties) {
    super(props);

    this.state = {
      visible: false,
      results: [],
      resultSelected: -1,
    };

    ipcRenderer.receive('show', () => {
      if (!this.state.visible) {
        this.setState({
          visible: true,
          results: [],
          resultSelected: -1,
        });
        this.resizeWindow(0);
      }
    });

    ipcRenderer.receive('blur', this.hide);
  }

  resizeWindow(numItems: number) {
    let windowHeight = ITEM_HEIGHT * Math.min(numItems, getNumVisibleItems()) + INPUT_HEIGHT;
    if (numItems > 0) {
      windowHeight += ITEM_HEIGHT;
    }
    ipcRenderer.send('height', windowHeight);
  }

  hide = () => {
    ipcRenderer.send('hide');
    this.clearItems(true);
  }

  clearItems = (hide: boolean = false) => {
    if (hide) {
      this.setState({
        results: [],
        resultSelected: -1,
        visible: false
      });
    } else {
      this.setState({
        results: [],
        resultSelected: -1,
      });
    }
    this.resizeWindow(0);
  }

  loadItems = (text: string, select: number | string = -1): Command | undefined => {
    const results = ipcRenderer.sendSync<Array<PriorizedSearchResult>>('find', text);

    const index = typeof select === 'string'
      ? results.findIndex(item => item.command.id === select) ?? -1
      : select;

    const canSelect = results.length > index;

    this.resizeWindow(results.length);
    this.setState({ results, resultSelected: canSelect? index : -1 });
    if (canSelect && index >= 0) {
      return results[index].command;
    }
  }

  selectNext = (): Command | undefined => {
    const { results, resultSelected } = this.state;
    const nextSelect = resultSelected + 1;
    if (results.length > nextSelect) {
      this.setState({ resultSelected: nextSelect });
      return results[nextSelect].command;
    }
  }

  selectPrev = (): Command | undefined => {
    const { results, resultSelected } = this.state;
    const nextSelect = resultSelected - 1;
    if (nextSelect >= 0) {
      this.setState({ resultSelected: nextSelect });
      return results[nextSelect].command;
    }
  }

  onSubmitForm = (inputText: string, ev: Event) => {
    ev.preventDefault();

    const { results, resultSelected } = this.state;
    const result = ipcRenderer.sendSync('perform', results[resultSelected].command.id, inputText);
    if (result) this.hide();
  }

  override render(): JSX.Element {
    if (!this.state.visible)
      return <div/>;

    return (
      <div id="app" className={ classNames('itemed', this.state.results.length > 0) }>
        <InputLauncher
          hideApp={ this.hide }
          loadItems={ this.loadItems }
          clearItems={ this.clearItems }
          findAndSelectNextItem={ this.selectNext }
          findAndSelectPrevItem={ this.selectPrev }
          onSubmitForm={ this.onSubmitForm } />

        <ItemList
          hideApp={ this.hide }
          results={ this.state.results }
          resultSelected={ this.state.resultSelected } />
      </div>
    );
  }
}