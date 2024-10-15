import { useEffect, useState } from 'react';

import { useSettingsContext } from 'contexts/SettingsContext';

export const useOpmlFileUrl = () => {
  const { feedSettings } = useSettingsContext();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const feedEntries = Object.entries(feedSettings).filter(
      ([_, { subscribedAt }]) => subscribedAt !== null,
    );

    if (feedEntries.length === 0) {
      setUrl(null);

      return;
    }

    const opml = `<?xml version="1.0" encoding="UTF-8"?>
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

    const file = new File([opml], 'podmonster.opml', { type: 'text/xml' });
    const fileUrl = URL.createObjectURL(file);

    setUrl(fileUrl);

    return () => {
      URL.revokeObjectURL(fileUrl);
    };
  }, [feedSettings]);

  return url;
};
