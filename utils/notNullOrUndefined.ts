export function notNullOrUndefined<TType>(
  item: TType | null | undefined
): item is TType {
  return item !== null && item !== undefined;
}
