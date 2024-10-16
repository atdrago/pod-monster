import 'server-only';

import type { Metadata } from 'next';

interface OgMetadata {
  /**
   * A URL to an audio file to accompany this object.
   */
  audio?: string;
  /**
   * A one to two sentence description of your object.
   */
  description?: string;
  /**
   * An image URL which should represent your object within the graph.
   */
  image: string;
  /**
   * The locale these tags are marked up in. Of the format language_TERRITORY.
   * Default is en_US.
   */
  locale?: string;
  /**
   * The title of your object as it should appear within the graph, e.g., "The
   * Rock".
   */
  title: string;
  /**
   * The type of your object, e.g., "video.movie". Depending on the type you
   * specify, other properties may also be required.
   * @see https://ogp.me/#types
   */
  type:
    | 'article'
    | 'book'
    | 'profile'
    | 'website'
    | 'music.song'
    | 'music.album'
    | 'music.playlist'
    | 'music.radio_station'
    | 'video.movie'
    | 'video.episode'
    | 'video.tv_show'
    | 'video.other';
  /**
   * The canonical URL of your object that will be used as its permanent ID in
   * the graph, e.g., "https://www.imdb.com/title/tt0117500/".
   */
  url: string;
  /**
   * A URL to a video file that complements this object.
   */
  video?: string;
}

interface CreateMetadataOptions {
  description: string;
  ogMetadata?: OgMetadata;
  titles: Array<string>;
}

export async function createMetadata({
  description,
  ogMetadata,
  titles,
}: CreateMetadataOptions): Promise<Metadata> {
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
