import { Dispatch, SetStateAction, useState } from 'react';
import { useDebounce } from 'use-debounce';

/**
 *
 * @param initialState
 * @param wait = 500
 * @returns [value, valueDebounced, setValue]
 */
export const useStateWithDebounce = <TValue>(
  initialState: TValue | (() => TValue),
  delay: number,
  options?: {
    equalityFn?: ((left: TValue, right: TValue) => boolean) | undefined;
    leading?: boolean | undefined;
    maxWait?: number | undefined;
    trailing?: boolean | undefined;
  },
): [TValue, TValue, Dispatch<SetStateAction<TValue>>] => {
  const [value, setValue] = useState(initialState);
  const [valueDebounced] = useDebounce(value, delay, options);

  return [value, valueDebounced, setValue];
};
