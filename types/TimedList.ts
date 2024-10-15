export interface TimedListItem {
  from: number;
  text: string;
}

export interface TimedListProps<
  TListItem extends TimedListItem = TimedListItem,
> {
  error?: Error | null;
  hasError?: boolean;
  index: number;
  isLoading?: boolean;
  isVisibleAsSubtitle?: boolean;
  list: Array<TListItem>;
  onIsVisibleAsSubtitleChange?: (isVisibleAsSubtitle: boolean) => void;
  onItemClick?: (item: TListItem) => void;
  title: string;
}
