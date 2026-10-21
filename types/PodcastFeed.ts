interface PodcastFunding {
  message: string;
  url: string;
}

interface PodcastPerson {
  group?: string;
  href?: string;
  img?: string;
  name: string;
  role?: string;
}

interface PodcastTranscript {
  language?: string;
  rel?: string;
  type: string;
  url: string;
}

/**
 * A show from Podcast Index or from the RSS feed. A field that the source does
 * not give is absent.
 */
export interface PodcastFeed {
  author?: string;
  categories?: Array<string>;
  description?: string;
  explicit?: boolean;
  format: 'atom' | 'rss';
  funding?: PodcastFunding;
  image?: string;
  isSerial: boolean;
  link?: string;
  podcastIndexId?: number;
  title: string;
  url: string;
}

/**
 * An episode from Podcast Index or from the RSS feed. A field that the source
 * does not give is absent.
 */
export interface PodcastEpisode {
  chaptersUrl?: string;
  /** Unix time in seconds, the same unit as Podcast Index. */
  datePublished?: number;
  description?: string;
  /** Length in seconds. */
  duration?: number;
  enclosureType?: string;
  enclosureUrl?: string;
  episodeNumber?: number;
  episodeType?: string;
  explicit?: boolean;
  feedImage?: string;
  feedTitle: string;
  feedUrl: string;
  /**
   * The trimmed guid, else the enclosure URL. The native app uses the same
   * identity, so one episode gets one key from either source.
   */
  identity: string;
  image?: string;
  persons?: Array<PodcastPerson>;
  seasonNumber?: number;
  title: string;
  transcripts?: Array<PodcastTranscript>;
}
