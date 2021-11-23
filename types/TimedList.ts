export interface ITimedListItem {
  endTimeSeconds?: number;
  startTimeSeconds?: number;
  text: string;
}

export interface ITimedListProps<
  TListItem extends ITimedListItem = ITimedListItem
> {
  index: number;
  list: Array<TListItem>;
  onItemClick?: (item: TListItem) => void;
  title: string;
}
