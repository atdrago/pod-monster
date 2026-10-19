import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Suspense, use, useEffect, useState } from 'react';

import FeedError from './error';

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/feeds/aHR0cHM6Ly9leGFtcGxlLmNvbS9mZWVkLnhtbA',
  useRouter: () => ({ refresh }),
}));

const NEVER_SETTLED = new Promise<never>(() => {});

const RefreshedTree = ({ isRefreshing }: { isRefreshing: boolean }) => {
  if (isRefreshing) {
    use(NEVER_SETTLED);
  }

  return null;
};

/**
 * A real `router.refresh()` suspends its transition until the server sends the
 * new page. This mock does the same with a promise that never settles.
 */
const FeedErrorWithPendingRefresh = ({ reset }: { reset: () => void }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refresh.mockImplementation(() => setIsRefreshing(true));
  }, []);

  return (
    <>
      <FeedError error={new Error('The feed is unavailable')} reset={reset} />
      <Suspense fallback={null}>
        <RefreshedTree isRefreshing={isRefreshing} />
      </Suspense>
    </>
  );
};

describe('FeedError', () => {
  afterEach(() => {
    refresh.mockReset();
  });

  it('should render a message and a "Try again" button', () => {
    render(
      <FeedError
        error={new Error('The feed is unavailable')}
        reset={vi.fn()}
      />,
    );

    expect(
      screen.getByText("We couldn't load this podcast right now"),
    ).toBeVisible();
    expect(
      screen.getByText(
        'This is often temporary, so please try again in a moment.',
      ),
    ).toBeVisible();
    expect(screen.getByText('Try again')).toBeEnabled();
  });

  it('should not show the error text', () => {
    render(
      <FeedError
        error={new Error('The feed is unavailable')}
        reset={vi.fn()}
      />,
    );

    expect(screen.queryByText(/The feed is unavailable/)).toBeNull();
  });

  it('should refresh the router and reset the boundary on a click', async () => {
    const reset = vi.fn();

    render(
      <FeedError error={new Error('The feed is unavailable')} reset={reset} />,
    );

    fireEvent.click(screen.getByText('Try again'));

    await waitFor(() => expect(reset).toHaveBeenCalledTimes(1));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('should disable the button while the retry is pending', async () => {
    const reset = vi.fn();

    render(<FeedErrorWithPendingRefresh reset={reset} />);

    fireEvent.click(screen.getByText('Try again'));

    await waitFor(() => expect(screen.getByText('Try again')).toBeDisabled());
  });

  it('should not call the handler again on a second click while the retry is pending', async () => {
    const reset = vi.fn();

    render(<FeedErrorWithPendingRefresh reset={reset} />);

    fireEvent.click(screen.getByText('Try again'));
    await waitFor(() => expect(screen.getByText('Try again')).toBeDisabled());
    fireEvent.click(screen.getByText('Try again'));

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
