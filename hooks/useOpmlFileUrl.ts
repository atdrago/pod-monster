import { useEffect, useMemo, useState } from 'react';

import { useSettingsContext } from 'contexts/SettingsContext';

const XML_ENTITIES: Record<string, string> = {
  '"': '&quot;',
  '&': '&amp;',
  "'": '&apos;',
  '<': '&lt;',
  '>': '&gt;',
};

// A feed URL often has `&` in its query, so an unescaped value breaks the file.
const escapeXmlAttribute = (value: string) =>
  value.replace(/["&'<>]/g, (character) => XML_ENTITIES[character]);

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
      .map(([feedUrl, feed]) => {
        return `<outline
      htmlUrl="${escapeXmlAttribute(feed.htmlUrl ?? '')}"
      text="${escapeXmlAttribute(feed.title)}"
      title="${escapeXmlAttribute(feed.title)}"
      type="${feed.type ?? ''}"
      xmlUrl="${escapeXmlAttribute(feedUrl)}"
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
