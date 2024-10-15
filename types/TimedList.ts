export interface ITimedListItem {
  from: number;
  text: string;
}

export interface ITimedListProps<
  TListItem extends ITimedListItem = ITimedListItem,
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
