import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import { SettingsProvider, useSettingsContext } from 'contexts/SettingsContext';
import { fetchOpmlImport } from 'rest/fetchOpmlImport';

import { SettingsPage } from './SettingsPage';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));
vi.mock('rest/fetchOpmlImport', () => ({ fetchOpmlImport: vi.fn() }));

const DATABASE_NAME = 'pod.monster';
const SUBSCRIBED_AT = '2026-10-01T00:00:00.000Z';
const EXISTING_FEED_URL = 'https://example.com/existing.xml';
const IMPORTED_FEED_URL = 'https://example.com/imported.xml?format=mp3';
const IMPORTED_FEED_SETTINGS_ITEM = {
  podcastIndexId: 920666,
  subscribedAt: SUBSCRIBED_AT,
  title: 'Imported Show',
};

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function renderSettingsPage() {
  const queryClient = new QueryClient();
  const rendered = renderHook(() => useSettingsContext(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          {children}
          <SettingsPage />
        </SettingsProvider>
      </QueryClientProvider>
    ),
  });

  await waitFor(() =>
    expect(rendered.result.current.isDoneHydratingFromIdb).toBe(true),
  );

  return rendered;
}

/** The label of the file field changes while an import is pending. */
function chooseOpmlFile(fieldLabel = 'Import OPML') {
  fireEvent.change(screen.getByLabelText(fieldLabel), {
    target: {
      files: [new File(['<opml/>'], 'podmonster.opml', { type: 'text/xml' })],
    },
  });
}

describe('SettingsPage', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  afterEach(() => {
    vi.mocked(fetchOpmlImport).mockReset();
  });

  it('should merge the imported shows, keyed by feed URL, into the library, and list the shows that were not imported', async () => {
    vi.mocked(fetchOpmlImport).mockResolvedValue({
      errors: [{ title: 'Member Show' }],
      feedSettings: {
        'HTTPS://EXAMPLE.COM/imported.xml?format=mp3':
          IMPORTED_FEED_SETTINGS_ITEM,
      },
    });

    const { result } = await renderSettingsPage();

    await act(() =>
      result.current.setFeedSettingsItem(
        { feedUrl: EXISTING_FEED_URL },
        { subscribedAt: SUBSCRIBED_AT, title: 'Existing Show' },
      ),
    );

    chooseOpmlFile();

    await waitFor(() =>
      expect(
        result.current.getFeedSettingsItem({ feedUrl: IMPORTED_FEED_URL }),
      ).toEqual(IMPORTED_FEED_SETTINGS_ITEM),
    );
    expect(
      result.current.getFeedSettingsItem({ feedUrl: EXISTING_FEED_URL }),
    ).toEqual({ subscribedAt: SUBSCRIBED_AT, title: 'Existing Show' });
    expect(Object.keys(result.current.feedSettings)).toEqual([
      EXISTING_FEED_URL,
      IMPORTED_FEED_URL,
    ]);
    expect(
      await screen.findByText('All feeds except the following were imported:'),
    ).toBeVisible();
    expect(screen.getByText('Member Show')).toBeVisible();
  });

  it('should not start a second import while an import is pending', async () => {
    let resolveImport: (
      value: Awaited<ReturnType<typeof fetchOpmlImport>>,
    ) => void = () => {};

    vi.mocked(fetchOpmlImport).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveImport = resolve;
        }),
    );

    await renderSettingsPage();

    chooseOpmlFile();

    expect(await screen.findByText('Importing...')).toBeVisible();

    chooseOpmlFile('Importing...');
    await act(async () => {});

    expect(fetchOpmlImport).toHaveBeenCalledOnce();

    await act(async () => {
      resolveImport({ errors: [], feedSettings: {} });
    });

    expect(
      await screen.findByText(/All feeds were imported successfully\./),
    ).toBeVisible();
  });
});
