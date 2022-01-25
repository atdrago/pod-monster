import NextHead from 'next/head';

import { vars } from 'styles';
import type { IHeadProps } from 'types';

export const Head = ({ description, ogMetadata, titles }: IHeadProps) => {
  const titlesWithAppName = [...titles, 'pod.monster (alpha)'];

  // These truncation lengths were taken from https://www.opengraph.xyz/
  const truncatedTitle = ogMetadata?.title?.substring(0, 60);
  const truncatedDescription = ogMetadata?.description?.substring(0, 155);

  return (
    <NextHead>
      <title>{titlesWithAppName.join(' - ')}</title>
      <meta name="application-name" content="pod.monster" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="pod.monster" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-TileColor" content="#272822" />
      <meta name="msapplication-tap-highlight" content="no" />
      <meta name="theme-color" content="#272822" />
      {/*
      <link rel="apple-touch-icon" href="/icons/touch-icon-iphone.png" />
      <link
        rel="apple-touch-icon"
        sizes="152x152"
        href="/icons/touch-icon-ipad.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/icons/touch-icon-iphone-retina.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="167x167"
        href="/icons/touch-icon-ipad-retina.png"
      />
      */}
      <link rel="manifest" href="/manifest.json" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <meta name="description" content={description} />
      <meta name="theme-color" content={vars.color.background} />
      {ogMetadata && (
        <>
          <meta property="og:title" content={truncatedTitle} />
          <meta property="og:image" content={ogMetadata.image} />
          <meta property="og:type" content={ogMetadata.type} />
          <meta property="og:url" content={ogMetadata.url} />
          <meta property="og:site_name" content="Pod Monster" />
          {ogMetadata.audio && (
            <meta property="og:audio" content={ogMetadata.audio} />
          )}
          {ogMetadata.description && (
            <meta property="og:description" content={truncatedDescription} />
          )}
          {ogMetadata.locale && (
            <meta property="og:locale" content={ogMetadata.locale} />
          )}
          {ogMetadata.video && (
            <meta property="og:video" content={ogMetadata.video} />
          )}

          <meta name="twitter:card" content="summary_large_image" />
          <meta property="twitter:domain" content="pod.monster" />
          <meta property="twitter:url" content={ogMetadata.url} />
          <meta name="twitter:title" content={truncatedTitle} />
          <meta name="twitter:description" content={truncatedDescription} />
          <meta name="twitter:image" content={ogMetadata.image} />
        </>
      )}
      <link
        href="/apple-touch-icon.png"
        rel="apple-touch-icon"
        sizes="180x180"
      />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link
        href="/favicon-dark.svg"
        media="(prefers-color-scheme: dark)"
        rel="icon"
        type="image/svg+xml"
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
      <link href="/manifest.json" rel="manifest" />
      <link
        color={vars.color.foreground}
        href="/safari-pinned-tab.svg"
        rel="mask-icon"
      />

      {/* apple splash screen images */}
      {/*
        <link rel='apple-touch-startup-image' href='/images/apple_splash_2048.png' sizes='2048x2732' />
        <link rel='apple-touch-startup-image' href='/images/apple_splash_1668.png' sizes='1668x2224' />
        <link rel='apple-touch-startup-image' href='/images/apple_splash_1536.png' sizes='1536x2048' />
        <link rel='apple-touch-startup-image' href='/images/apple_splash_1125.png' sizes='1125x2436' />
        <link rel='apple-touch-startup-image' href='/images/apple_splash_1242.png' sizes='1242x2208' />
        <link rel='apple-touch-startup-image' href='/images/apple_splash_750.png' sizes='750x1334' />
        <link rel='apple-touch-startup-image' href='/images/apple_splash_640.png' sizes='640x1136' />
      */}
    </NextHead>
  );
};
