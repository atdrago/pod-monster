import { useCallback, useEffect, useState } from 'react';

export const useIsMounted = (): boolean => {
  const [isMounted, setIsMounted] = useState(false);

  const updateMounted = useCallback((value: boolean) => {
    setIsMounted(value);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      updateMounted(true);
    });

    return () => {
      queueMicrotask(() => {
        updateMounted(false);
      });
    };
  }, [updateMounted]);

  return isMounted;
};
