import React from 'react';
import './item.css';
import { classNames } from './support';
import defaultIcon from './sources/defaultIcon.png';
import { Command } from '../shared-models/models';

interface ItemProperties {
  item: Command,
  matchingIndexes?: Array<[number, number]>,
  selected: boolean,
  onClick: (item: Command, ev: Event) => void
}
  
interface ItemState { }

export default class Item extends React.Component<ItemProperties, ItemState> {

  private selfRef!: HTMLDivElement;

  onClick = (ev: MouseEvent) => {
    const { item, onClick } = this.props;
    if (onClick) {
      onClick(item, ev);
    }
  }

  scrollIntoView = () => {
    this.selfRef.scrollIntoView({ block: 'center' });
  }

  override render(): JSX.Element {
    const { item, matchingIndexes, selected } = this.props;

    const icon = (icon => {
      if (icon.match(/https?:\/\//))
        return icon;
      return icon? `./icons/${icon}.png` : defaultIcon;
    })(item.icon);

    const title = matchingIndexes?.slice().reverse()
      .reduce((title, [startIndex, endIndex]) =>
        title.substring(0, startIndex) +'{b}'+
        title.substring(startIndex, endIndex) +'{/b}'+
        title.substring(endIndex), item.title)
      .replace(/</gm, '&lt;')
      .replace(/>/gm, '&gt;')
      .replace(/{b}(.*?){\/b}/gm, '<b>$1</b>')
      .replace(/{u}(.*?){\/u}/gm, '<u>$1</u>')
      .replace(/{s}(.*?){\/s}/gm, '<s>$1</s>')
      .replace(/{i}(.*?){\/i}/gm, '<i>$1</i>')
      ?? item.title;

    return (
      <div
        className={ classNames(['item', 'selected', 'arguments'], [true, selected, item.requiresParams]) }
        onClick={ (reactMouseEvent) => this.onClick(reactMouseEvent.nativeEvent) }
        ref={ ref => this.selfRef = ref! } >

        <div className='item-line'>
          <div className='icon'>
            <img src={ icon } alt=''/>
          </div>
          <span dangerouslySetInnerHTML={{__html: title}}></span>
        </div>

      </div>
    );
  }
}
