import { useEffect, useMemo, useState } from 'react';

import { useSettingsContext } from 'contexts/SettingsContext';

export const useOpmlFileUrl = () => {
  const { feedSettings } = useSettingsContext();
  const [url, setUrl] = useState<string | null>(null);

  const opmlContent = useMemo(() => {
    const feedEntries = Object.entries(feedSettings).filter(
      ([_, { subscribedAt }]) => subscribedAt !== null,
    );

    if (feedEntries.length === 0) {
      return null;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>Pod Monster Podcast Subscriptions</title>
  </head>
  <body>
    ${feedEntries
      .map(([_feedId, feed]) => {
        return `<outline
      htmlUrl="${feed.htmlUrl ?? ''}"
      text="${feed.title}"
      title="${feed.title}"
      type="${feed.type ?? ''}"
      xmlUrl="${feed.xmlUrl ?? ''}"
    />`;
      })
      .join('\n    ')}
  </body>
</opml>`;
  }, [feedSettings]);

  useEffect(() => {
    let fileUrl: string | null = null;

    if (opmlContent !== null) {
      const file = new File([opmlContent], 'podmonster.opml', {
        type: 'text/xml',
      });
      fileUrl = URL.createObjectURL(file);
    }

    // Use queueMicrotask to defer the state update to avoid synchronous setState
    queueMicrotask(() => {
      setUrl(fileUrl);
    });

    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [opmlContent, setUrl]);

  return url;
};
