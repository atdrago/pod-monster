import { useIsMounted } from 'hooks/useIsMounted';

export const useIsMobileDevice = (): boolean => {
  const isMounted = useIsMounted();

  return isMounted
    ? /Mobile|Android|BlackBerry/.test(window.navigator.userAgent)
    : false;
};
