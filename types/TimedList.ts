export interface ITimedListItem {
  endTimeSeconds?: number;
  startTimeSeconds?: number;
  text: string;
}

export interface ITimedListProps<
  TListItem extends ITimedListItem = ITimedListItem
> {
  hasError?: boolean;
  index: number;
  isLoading?: boolean;
  list: Array<TListItem>;
  onItemClick?: (item: TListItem) => void;
  title: string;
}
