import { FunctionComponent, memo, useEffect, useRef, useState } from 'react';
import {
  FixedSizeList as List,
  ListChildComponentProps,
  areEqual,
} from 'react-window';

import { Checkbox } from 'components/atoms/Checkbox';
import { Details } from 'components/atoms/Details';
import { Typography } from 'components/atoms/Typography';
import type { ITimedListProps } from 'types';
import { notNullOrUndefined } from 'utils/notNullOrUndefined';

import {
  paragraph,
  transcriptItem,
  transcriptItemHighlight,
} from './timedList.css';

const ListItemComponent = memo(function Row({
  data,
  index: listItemIndex,
  style,
}: ListChildComponentProps) {
  const { text } = data.list[listItemIndex];
  const isCurrentTranscriptItem = data.index === listItemIndex;
  const className = [
    transcriptItem,
    isCurrentTranscriptItem ? transcriptItemHighlight : undefined,
  ]
    .filter(notNullOrUndefined)
    .join(' ');

  return (
    <span
      role="button"
      className={className}
      key={listItemIndex}
      style={style}
      onClick={() => data.onItemClick(data.list[listItemIndex])}
    >
      {text}
    </span>
  );
},
areEqual);

export const TimedList: FunctionComponent<ITimedListProps> = memo(
  function TimedListMemo({
    index,
    list,
    onItemClick = () => {
      // noop
    },
    title,
  }) {
    const indexRef = useRef<number>(index);
    const indexUpdatedAtRef = useRef<number>(Date.now());
    const listRef = useRef<List | null>(null);
    const [isScrollingLocked, setIsScrollingLocked] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const isOpenRef = useRef(isOpen);

    useEffect(() => {
      if (isScrollingLocked) {
        listRef.current?.scrollToItem(index, 'center');
      }
    }, [index, isScrollingLocked]);

    useEffect(() => {
      indexRef.current = index;
      indexUpdatedAtRef.current = Date.now();
    }, [index]);

    useEffect(() => {
      isOpenRef.current = isOpen;
    }, [isOpen]);

    /**
     * Only smooth scroll the details element is open now, and was open on the
     * last render.
     */
    const shouldSmoothScroll = isOpenRef.current && isOpen;

    return list.length > 0 ? (
      <Details
        footer={
          <Checkbox
            checked={isScrollingLocked}
            onChange={(event) => {
              setIsScrollingLocked(event.currentTarget.checked);
            }}
          >
            Lock scrolling
          </Checkbox>
        }
        onToggle={() => {
          // Fixes an issue where the transcript would show an empty box on the
          // first page load if the `start` query parameter was provided.
          listRef.current?.forceUpdate();
          setIsOpen(!isOpen);
        }}
        open={isOpen}
        summary={
          <Typography as="h4" size="headingSmaller">
            {title}
          </Typography>
        }
      >
        <Typography className={paragraph} as="div" size="paragraph">
          <List
            ref={listRef}
            width={'100%'}
            height={56 * 5}
            itemCount={list.length}
            itemData={{ index, list, onItemClick }}
            itemSize={56}
            style={
              isScrollingLocked
                ? {
                    overflow: 'hidden',
                    scrollBehavior: shouldSmoothScroll ? 'smooth' : 'auto',
                  }
                : {}
            }
          >
            {ListItemComponent}
          </List>
        </Typography>
      </Details>
    ) : null;
  }
);
