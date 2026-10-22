import { render, screen } from '@testing-library/react';
import { commands } from 'vitest/browser';

import { useSettingsContext } from 'contexts/SettingsContext';

import { AnotherTabNotice } from './AnotherTabNotice';

vi.mock('contexts/SettingsContext', () => ({ useSettingsContext: vi.fn() }));

function mockIsBlockedByAnotherTab(isBlockedByAnotherTab: boolean) {
  vi.mocked(useSettingsContext).mockReturnValue({
    isBlockedByAnotherTab,
  } as ReturnType<typeof useSettingsContext>);
}

describe('AnotherTabNotice', () => {
  it('should ask the visitor to close the other tab while that tab blocks the database', async () => {
    mockIsBlockedByAnotherTab(true);

    const { container } = render(<AnotherTabNotice />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Pod Monster is open in another tab. Close that tab, and this page will finish loading your library.',
    );
    expect(screen.getByRole('alert')).toBeVisible();
    await expect(container.firstElementChild).toMatchScreenshot(
      'anotherTabNotice-default.png',
    );
  });

  it('should render nothing when no other tab blocks the database', () => {
    mockIsBlockedByAnotherTab(false);

    const { container } = render(<AnotherTabNotice />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should add a custom className to the root', () => {
    mockIsBlockedByAnotherTab(true);

    render(<AnotherTabNotice className="custom-class" />);

    expect(screen.getByRole('alert')).toHaveClass('custom-class');
  });

  describe('dark', () => {
    beforeAll(async () => {
      await commands.setColorScheme('dark');
    });

    afterAll(async () => {
      await commands.setColorScheme('light');
    });

    it('should render the notice while another tab blocks the database', async () => {
      mockIsBlockedByAnotherTab(true);

      const { container } = render(<AnotherTabNotice />);

      await expect(container.firstElementChild).toMatchScreenshot(
        'anotherTabNotice-default-dark.png',
      );
    });
  });
});
