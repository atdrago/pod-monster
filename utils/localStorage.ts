/**
 * These localStorage utility functions should be used in place of using
 * `window.localStorage` directly. In cases where the user has enabled private
 * browsing, or has turned off cookies, these functions will fallback to using
 * an in-memory storage object.
 *
 * `navigator.cookieEnabled` will handle most cases where cookies are disabled
 * by the user, however, some browsers will return `true` within a third-party
 * frame even if third-party cookies are disabled, and then throw an exception
 * when attempting to access `window.localStorage`. For those situations, we
 * also wrap each call in a try/catch.
 */

const inMemoryLocalStorage: Record<string, string | null> = {};

/**
 * Try to use `localStorage.getItem` if available, and fallback to using
 * in-memory storage if not.
 */
export const tryLocalStorageGetItem: typeof window.localStorage.getItem = (
  key,
) => {
  if (window.navigator.cookieEnabled) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return inMemoryLocalStorage[key] ?? null;
    }
  }

  return inMemoryLocalStorage[key] ?? null;
};
