import { commands } from 'vitest/browser';

describe('html', () => {
  it('should use the background color and the foreground color', () => {
    expect(document.documentElement).toHaveStyle({
      backgroundColor: 'rgb(208, 208, 208)',
      color: 'rgb(39, 40, 34)',
    });
  });

  it('should use antialiased font smoothing', () => {
    expect(document.documentElement).toHaveStyle({
      WebkitFontSmoothing: 'antialiased',
    });
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should use the background color and the foreground color', () => {
      expect(document.documentElement).toHaveStyle({
        backgroundColor: 'rgb(39, 40, 34)',
        color: 'rgb(208, 208, 208)',
      });
    });
  });
});
