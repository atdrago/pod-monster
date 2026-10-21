import { act, renderHook, waitFor } from '@testing-library/react';

import { SettingsProvider, useSettingsContext } from 'contexts/SettingsContext';

import { useOpmlFileUrl } from './useOpmlFileUrl';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const DATABASE_NAME = 'pod.monster';
const SUBSCRIBED_AT = '2026-10-01T00:00:00.000Z';
const FEED_URL = 'https://example.com/feed.xml?format=mp3&quality=high';
const MEMBER_FEED_URL =
  'https://www.patreon.com/rss/example?auth=Secret123&show=456';
const OLD_FEED_URL = 'https://example.com/old.xml';

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function renderUseOpmlFileUrl() {
  const rendered = renderHook(
    () => ({ opmlFileUrl: useOpmlFileUrl(), settings: useSettingsContext() }),
    { wrapper: SettingsProvider },
  );

  await waitFor(() =>
    expect(rendered.result.current.settings.isDoneHydratingFromIdb).toBe(true),
  );

  return rendered;
}

async function readOutlines(opmlFileUrl: string) {
  const response = await fetch(opmlFileUrl);
  const opmlDocument = new DOMParser().parseFromString(
    await response.text(),
    'text/xml',
  );

  expect(opmlDocument.querySelector('parsererror')).toBeNull();

  return Array.from(opmlDocument.querySelectorAll('outline')).map(
    (outline) => ({
      htmlUrl: outline.getAttribute('htmlUrl'),
      text: outline.getAttribute('text'),
      title: outline.getAttribute('title'),
      type: outline.getAttribute('type'),
      xmlUrl: outline.getAttribute('xmlUrl'),
    }),
  );
}

describe('useOpmlFileUrl', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  it('should give no file when the library has no subscribed show', async () => {
    const { result } = await renderUseOpmlFileUrl();

    await act(() =>
      result.current.settings.setAllFeedSettings({
        [OLD_FEED_URL]: { subscribedAt: null, title: 'Old Show' },
      }),
    );

    expect(result.current.opmlFileUrl).toBeNull();
  });

  it('should write the feed URL of each subscribed show as its xmlUrl, with the XML escaped', async () => {
    const { result } = await renderUseOpmlFileUrl();

    await act(() =>
      result.current.settings.setAllFeedSettings({
        [FEED_URL]: {
          htmlUrl: 'https://example.com/show?a=1&b=2',
          podcastIndexId: 920666,
          subscribedAt: SUBSCRIBED_AT,
          title: 'Tom & Jerry "Live" <Daily>',
          type: 'rss',
        },
        [MEMBER_FEED_URL]: {
          subscribedAt: SUBSCRIBED_AT,
          title: 'Member Show',
        },
        [OLD_FEED_URL]: { subscribedAt: null, title: 'Old Show' },
      }),
    );

    await waitFor(() => expect(result.current.opmlFileUrl).not.toBeNull());

    const opmlFileUrl = result.current.opmlFileUrl;

    if (opmlFileUrl === null) {
      throw new Error('The hook gave no file URL.');
    }

    await expect(readOutlines(opmlFileUrl)).resolves.toEqual([
      {
        htmlUrl: 'https://example.com/show?a=1&b=2',
        text: 'Tom & Jerry "Live" <Daily>',
        title: 'Tom & Jerry "Live" <Daily>',
        type: 'rss',
        xmlUrl: FEED_URL,
      },
      {
        htmlUrl: '',
        text: 'Member Show',
        title: 'Member Show',
        type: '',
        xmlUrl: MEMBER_FEED_URL,
      },
    ]);
  });
});
