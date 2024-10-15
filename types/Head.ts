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

export interface HeadProps {
  description: string;
  ogMetadata?: OgMetadata;
  titles: Array<string>;
}
