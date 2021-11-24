export const getPodcastPath = ({ id }: { id: string | number }): string => {
  return `/podcasts/${id}`;
};

export const getEpisodePath = ({
  episodeId,
  feedId,
}: {
  episodeId: string | number;
  feedId: string | number;
}): string => {
  return `/podcasts/${feedId}/episodes/${episodeId}`;
};
