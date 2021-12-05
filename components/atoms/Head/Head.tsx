import NextHead from 'next/head';

import { vars } from 'styles';

interface IHeadProps {
  description: string;
  titles: Array<string>;
}

export const Head = ({ description, titles }: IHeadProps) => {
  const titlesWithAppName = [...titles, process.env.NEXT_PUBLIC_APP_NAME];

  return (
    <NextHead>
      <title>{titlesWithAppName.join(' - ')}</title>
      <meta name="description" content={description} />
      <meta name="theme-color" content={vars.color.background} />
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
