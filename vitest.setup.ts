import 'styles/app.css';
import 'styles/globals.css';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock SVG imports
vi.mock('*.svg', () => {
  const MockSvg = () => 'svg';

  return {
    ReactComponent: MockSvg,
    __esModule: true,
    default: MockSvg,
  };
});
