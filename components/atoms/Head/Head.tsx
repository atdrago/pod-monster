import NextHead from 'next/head';

import { vars } from 'styles';
import type { IHeadProps } from 'types';

export const Head = ({ description, ogMetadata, titles }: IHeadProps) => {
  const titlesWithAppName = [...titles, process.env.NEXT_PUBLIC_APP_NAME];

  return (
    <NextHead>
      <title>{titlesWithAppName.join(' - ')}</title>
      <meta name="description" content={description} />
      <meta name="theme-color" content={vars.color.background} />
      {ogMetadata && (
        <>
          <meta property="og:title" content={ogMetadata.title} />
          <meta property="og:image" content={ogMetadata.image} />
          <meta property="og:type" content={ogMetadata.type} />
          <meta property="og:url" content={ogMetadata.url} />
          <meta property="og:site_name" content="Pod Monster" />
          {ogMetadata.audio && (
            <meta property="og:audio" content={ogMetadata.audio} />
          )}
          {ogMetadata.description && (
            <meta property="og:description" content={ogMetadata.description} />
          )}
          {ogMetadata.locale && (
            <meta property="og:locale" content={ogMetadata.locale} />
          )}
          {ogMetadata.video && (
            <meta property="og:video" content={ogMetadata.video} />
          )}
        </>
      )}

      <link
        href="/apple-touch-icon.png"
        rel="apple-touch-icon"
        sizes="180x180"
      />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link
        rel="icon"
        type="image/svg+xml"
        href="/favicon-dark.svg"
        media="(prefers-color-scheme: dark)"
      />
      <link
        href="/favicon-32x32.png"
        rel="alternate icon"
        sizes="32x32"
        type="image/png"
      />
      <link
        href="/favicon-16x16.png"
        rel="alternate icon"
        sizes="16x16"
        type="image/png"
      />
      <link href="/site.webmanifest" rel="manifest" />
      <link
        color={vars.color.foreground}
        href="/safari-pinned-tab.svg"
        rel="mask-icon"
      />
    </NextHead>
  );
};
