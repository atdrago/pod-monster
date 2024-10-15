import { useMemo } from 'react';

import { notNullOrUndefined } from 'utils/notNullOrUndefined';

export const useClassNames = (
  ...classNames: Array<string | undefined>
): string => {
  return useMemo(
    () => classNames.filter(notNullOrUndefined).join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...classNames],
  );
};
