import React from 'react';
import './item-list.scss';
import Item from './item';
import { getNumVisibleItems, ITEM_HEIGHT } from './constants-conf';
import { Command, PriorizedSearchResult } from '../shared-models/models';

const ipcRenderer = window.ipcRenderer;

interface ItemListProperties {
  results: PriorizedSearchResult[],
  resultSelected: number,
  hideApp: () => void,
}

interface ItemListState { }

export default class ItemList extends React.Component<ItemListProperties, ItemListState> {

  private selectedItemRef?: Item;

  onClickedItem = (item: Command, ev: Event) => {
    const result = ipcRenderer.sendSync('perform', item.id, '');
    if (result) this.props.hideApp();
    else document.getElementById('input')?.focus();
  }

  override componentDidUpdate() {
    if (this.selectedItemRef) {
      this.selectedItemRef.scrollIntoView();
    }
  }

  override render(): JSX.Element {
    return (
      <div id="items" style={{ height: `${Math.min(this.props.results.length, getNumVisibleItems()) * ITEM_HEIGHT}px` }}>
        {
          this.props.results.map((result, i) => {
            const resultSelected = i === this.props.resultSelected;
            return <Item
              key={ i }
              item={ result.command }
              matchingIndexes={ result.matchingIndexes }
              selected={ resultSelected }
              ref={ ref => { if (resultSelected) this.selectedItemRef = ref ?? undefined } }
              onClick={ this.onClickedItem } />;
          })
        }
      </div>
    );
  }
}
