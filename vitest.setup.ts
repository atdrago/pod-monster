import 'styles/app.css';
import 'styles/globals.css';
import '@testing-library/jest-dom';
import { commands } from 'vitest/browser';

// One Playwright page serves every test file of a session. Thus, a dark
// scheme that a failed `afterAll` leaves behind must not leak into the next
// file.
beforeAll(async () => {
  await commands.setColorScheme('light');
});
