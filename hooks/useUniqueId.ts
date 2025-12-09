import { useRef } from 'react';

import { useIsMounted } from 'hooks/useIsMounted';

let uniqueId = 0;
const getUniqueId = () => uniqueId++;

export function useUniqueId(): string {
  const isMounted = useIsMounted();
  const idRef = useRef(getUniqueId());

  return isMounted ? `${idRef.current}` : '';
}
