import { useMediaContext } from 'contexts/MediaContext';
import { useSettingsContext } from 'contexts/SettingsContext';
import type { ImageDimensions } from 'types';
import type { PodcastEpisode } from 'types/PodcastFeed';

interface UsePlayEpisodeAtOptions {
  episode: Pick<
    PodcastEpisode,
    | 'chaptersUrl'
    | 'enclosureType'
    | 'enclosureUrl'
    | 'feedImage'
    | 'feedTitle'
    | 'feedUrl'
    | 'identity'
    | 'image'
    | 'title'
  >;
  episodeImageDimensions?: ImageDimensions;
  isVideo?: boolean;
}

/**
 * Returns the one start function of an episode. The play button and the
 * prompt of a share link use it.
 *
 * - An episode that is not in the player loads at `startTime`. With no
 *   `startTime`, it loads at its saved position.
 * - An episode that is in the player seeks to `startTime`. With no
 *   `startTime`, it plays on from where it is.
 * - Before the hydration from IndexedDB ends, the function does nothing. The
 *   saved position is not known yet, and the hydration replaces the player
 *   state.
 *
 * The function reads the saved position when it runs, not when the page
 * mounts, because the hydration from IndexedDB can end after the mount.
 */
export const usePlayEpisodeAt = ({
  episode,
  episodeImageDimensions,
  isVideo,
}: UsePlayEpisodeAtOptions) => {
  const {
    audioRef,
    didError,
    episodeIdentity,
    feedUrl,
    setChaptersUrl,
    setCurrentTime,
    setDidError,
    setEpisodeIdentity,
    setEpisodeImage,
    setEpisodeImageDimensions,
    setEpisodeTitle,
    setFeedImage,
    setFeedTitle,
    setFeedUrl,
    setIsPaused,
    setMediaPlayerCurrentTime,
    setSize,
    setSrc,
    setSrcType,
    src,
    videoRef,
  } = useMediaContext();
  const { getEpisodeSettingsItem, isDoneHydratingFromIdb } =
    useSettingsContext();

  const isThisEpisodeInThePlayer =
    episodeIdentity === episode.identity && feedUrl === episode.feedUrl;

  return async (startTime?: number) => {
    const { enclosureUrl } = episode;

    if (enclosureUrl === undefined || !isDoneHydratingFromIdb) {
      return;
    }

    // Two episodes can share an enclosure URL, so a match of `src` alone does
    // not show that this episode is in the player.
    if (!isThisEpisodeInThePlayer || enclosureUrl !== src) {
      const savedCurrentTime = getEpisodeSettingsItem({
        episodeIdentity: episode.identity,
        feedUrl: episode.feedUrl,
      })?.currentTime;

      setChaptersUrl(episode.chaptersUrl ?? null);
      setCurrentTime(startTime ?? savedCurrentTime ?? 0);
      setEpisodeIdentity(episode.identity);
      setEpisodeImage(episode.image ?? null);
      setEpisodeImageDimensions(episodeImageDimensions ?? null);
      setEpisodeTitle(episode.title);
      setFeedImage(episode.feedImage ?? null);
      setFeedTitle(episode.feedTitle);
      setFeedUrl(episode.feedUrl);
      setSrc(enclosureUrl);
      setSrcType(episode.enclosureType ?? null);
      setSize(isVideo ? 2 : 1);
    } else if (startTime !== undefined) {
      // `setCurrentTime` does nothing when the state already holds the time,
      // for example after a second seek to the same time. Thus, the seek also
      // sets the time of the media element.
      setCurrentTime(startTime);
      setMediaPlayerCurrentTime(startTime);

      if (audioRef.current) {
        audioRef.current.currentTime = startTime;
      }

      if (videoRef.current) {
        videoRef.current.currentTime = startTime;
      }
    }

    setIsPaused(false);

    if (audioRef.current) {
      if (didError) {
        setDidError(false);
        audioRef.current.load();
      }

      await audioRef.current.play();
    }

    if (videoRef.current) {
      if (didError) {
        setDidError(false);
        videoRef.current.load();
      }

      await videoRef.current.play();
    }
  };
};
