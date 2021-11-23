import { useEffect } from 'react';

/**
 * Adds a global --vh CSS variable which is the height in pixels of 1% of the
 * viewport height. This fixes an issue in mobile browsers where browser chrome
 * (top address bar, bottom button bar) is not excluded from the CSS vh unit,
 * causing undesired scrolling.
 *
 * See styles/layout.css.ts for usage of --vh.
 *
 * Ref: https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
 */
export const useGlobalVhCssVariable = (): void => {
  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;

      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);
};
