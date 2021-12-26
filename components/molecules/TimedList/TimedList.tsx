import { FunctionComponent, memo, useEffect, useRef, useState } from 'react';
import {
  FixedSizeList as List,
  ListChildComponentProps,
  areEqual,
} from 'react-window';

import { Checkbox } from 'components/atoms/Checkbox';
import { Details } from 'components/atoms/Details';
import { Typography } from 'components/atoms/Typography';
import { useClassNames } from 'hooks/useClassNames';
import type { ITimedListProps } from 'types';

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
  const className = useClassNames(
    transcriptItem,
    isCurrentTranscriptItem ? transcriptItemHighlight : undefined
  );

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

    const indexDelta = Math.abs(index - indexRef.current);
    const indexUpdatedAtDelta = Math.abs(
      Date.now() - indexUpdatedAtRef.current
    );
    /**
     * Only smooth scroll if it's a short distance to transition, and if the
     * current item hasn't changed within the last 750ms, and if the details
     * element is open now, and was also open on the last render. Otherwise,
     * the effect can be overwhelming and react-window has a hard time keeping
     * up.
     */
    const shouldSmoothScroll =
      indexDelta < 5 &&
      indexUpdatedAtDelta > 750 &&
      isOpenRef.current &&
      isOpen;

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
            height={48 * 5}
            itemCount={list.length}
            itemData={{ index, list, onItemClick }}
            itemSize={48}
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
