import { FunctionComponent, memo, useEffect, useRef, useState } from 'react';
import {
  FixedSizeList as List,
  ListChildComponentProps,
  areEqual,
} from 'react-window';

import { Checkbox } from 'components/atoms/Checkbox';
import { Details } from 'components/atoms/Details';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { useClassNames } from 'hooks/useClassNames';
import type { ITimedListProps } from 'types';

import {
  paragraph,
  transcriptItem,
  transcriptItemHighlight,
  transcriptItemOuter,
} from './timedList.css';

const ListItemComponent = memo(function Row({
  data,
  index: listItemIndex,
  style,
}: ListChildComponentProps) {
  const { text } = data.list[listItemIndex];
  const isCurrentTranscriptItem = data.index === listItemIndex;
  const outerClassName = useClassNames(
    transcriptItemOuter,
    isCurrentTranscriptItem ? transcriptItemHighlight : undefined
  );

  return (
    <span
      role="button"
      key={listItemIndex}
      className={outerClassName}
      style={style}
      onClick={() => data.onItemClick(data.list[listItemIndex])}
    >
      <span className={transcriptItem}>{text}</span>
    </span>
  );
},
areEqual);

export const TimedList: FunctionComponent<ITimedListProps> = memo(
  function TimedListMemo({
    error,
    hasError,
    index,
    isLoading,
    isVisibleAsSubtitle,
    list,
    onIsVisibleAsSubtitleChange,
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

    return (
      <Details
        isLoading={isLoading}
        hasError={hasError}
        footer={
          list.length > 0 ? (
            <Stack space="small">
              <Checkbox
                checked={isScrollingLocked}
                onChange={(event) => {
                  setIsScrollingLocked(event.currentTarget.checked);
                }}
              >
                Lock scrolling
              </Checkbox>
              {onIsVisibleAsSubtitleChange ? (
                <Checkbox
                  checked={!!isVisibleAsSubtitle}
                  onChange={(event) => {
                    onIsVisibleAsSubtitleChange(event.currentTarget.checked);
                  }}
                >
                  Show as subtitle
                </Checkbox>
              ) : null}
            </Stack>
          ) : null
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
          {hasError && error ? error.message : null}
          {list.length > 0 ? (
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
          ) : null}
        </Typography>
      </Details>
    );
  }
);
