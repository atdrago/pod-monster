'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Checkbox } from 'components/atoms/Checkbox';
import { Artwork } from 'components/atoms/Artwork';
import { Icon } from 'components/atoms/Icon';
import { Badge } from 'components/atoms/Badge';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { EpisodeProgress } from 'components/molecules/EpisodeProgress';
import ExplicitIcon from 'icons/explicit.svg';
import type { PodcastEpisode } from 'types/PodcastFeed';
import { getEpisodePath } from 'utils/paths';

interface EpisodeListProps {
  episodes: Array<
    Pick<
      PodcastEpisode,
      | 'datePublished'
      | 'duration'
      | 'episodeType'
      | 'explicit'
      | 'feedImage'
      | 'feedUrl'
      | 'identity'
      | 'image'
      | 'title'
    >
  >;
}

export const EpisodeList = ({ episodes }: EpisodeListProps) => {
  const [shouldIncludeTrailers, setShouldIncludeTrailers] = useState(false);

  const hasTrailers = episodes.some(
    ({ episodeType }) => episodeType === 'trailer',
  );

  const filteredEpisodes =
    hasTrailers && !shouldIncludeTrailers
      ? episodes.filter(({ episodeType }) => episodeType !== 'trailer')
      : episodes;

  return (
    <Stack space="small">
      <Stack kind="flexRow">
        <Typography as="h4" className="font-bold" size="headingSmaller">
          Episodes
        </Typography>
        {hasTrailers ? (
          <Checkbox
            checked={shouldIncludeTrailers}
            onChange={(event) =>
              setShouldIncludeTrailers(event.currentTarget.checked)
            }
          >
            Include trailers
          </Checkbox>
        ) : null}
      </Stack>
      {filteredEpisodes.map((episode) => {
        return (
          <Stack
            align="center"
            as={Link}
            className="no-underline"
            href={getEpisodePath({
              episodeIdentity: episode.identity,
              feedUrl: episode.feedUrl,
            })}
            key={episode.identity}
            kind="flexRow"
            space="small"
          >
            <Artwork
              alt=""
              height={80}
              shadow={true}
              src={episode.image || episode.feedImage}
              width={80}
            />
            <Stack
              space="xsmall"
              style={{ overflowY: 'hidden', padding: '4px 0' }}
            >
              <Stack kind="flexRow" space="xxsmall" align="center">
                {episode.explicit ? (
                  <Icon
                    style={{ verticalAlign: 'middle' }}
                    as={ExplicitIcon}
                    size="smallMedium"
                  />
                ) : null}{' '}
                {episode.episodeType === 'trailer' ? (
                  <Badge>Trailer</Badge>
                ) : null}
                <Typography
                  as="h3"
                  className="font-bold"
                  size="headingSmaller"
                  shouldTrimTextBox={false}
                  whitespace="ellipsis"
                >
                  {episode.title}
                </Typography>
              </Stack>
              <EpisodeProgress episode={episode} />
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
};
