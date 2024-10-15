import 'server-only';

import type { Metadata } from 'next';

import { IHeadProps } from 'types';

export async function createMetadata({
  description,
  ogMetadata,
  titles,
}: IHeadProps): Promise<Metadata> {
  const titlesWithAppName = [...titles, 'Pod Monster'];

  // These truncation lengths were taken from https://www.opengraph.xyz/
  const truncatedTitle = ogMetadata?.title?.substring(0, 60);
  const truncatedDescription = ogMetadata?.description?.substring(0, 155);

  return {
    appleWebApp: {
      capable: true,
      title: titlesWithAppName.join(' - '),
    },
    applicationName: 'Pod Monster',
    description,
    openGraph: {
      audio: ogMetadata?.audio,
      description: truncatedDescription,
      images: ogMetadata?.image,
      locale: ogMetadata?.locale,
      siteName: 'Pod Monster',
      title: truncatedTitle,
      type: 'website',
      url: ogMetadata?.url,
      videos: ogMetadata?.video,
    },
    title: titlesWithAppName.join(' - '),
    twitter: {
      card: 'summary_large_image',
      description: truncatedDescription,
      images: ogMetadata?.image,
      site: 'pod.monster',
      title: truncatedTitle,
    },
  };
}
