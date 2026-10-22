import 'vitest/browser';

declare module 'vitest/browser' {
  interface BrowserCommands {
    setColorScheme: (colorScheme: 'light' | 'dark') => Promise<void>;
  }
}
