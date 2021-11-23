/**
 * Make all properties in TType required and non-nullable
 * @example
 * Definite<{ foo?: string | null }> // => { foo: string }
 */
export type Definite<TType> = Required<{
  [TKey in keyof TType]: NonNullable<TType[TKey]>;
}>;

/**
 * Same as Pick, but all picked properties are required and non-nullable
 * @example
 * PickDefinite<{ bar?: string | null, foo?: string | null, }, 'bar'>
 * // => { bar: string }
 */
export type PickDefinite<TType, TKey extends keyof TType> = Definite<
  Pick<TType, TKey>
>;

/**
 * Retrieve the type of a single property from a type or interface
 * @example
 * type BarType = Take<{ foo: string, bar?: string }, 'bar'>
 * // => string | null | undefined
 */
export type Take<TType, TKey extends keyof TType> = TType[TKey];
