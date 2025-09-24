'use client';

import { Episode } from '@atdrago/podcast-index';
import Link from 'next/link';
import { useState } from 'react';

import { Checkbox } from 'components/atoms/Checkbox';
import { Artwork } from 'components/atoms/Artwork';
import { Icon } from 'components/atoms/Icon';
import { Badge } from 'components/atoms/Badge';
import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { EpisodeProgress } from 'components/molecules/EpisodeProgress';
import { EpisodeUnlistenedDot } from 'components/molecules/EpisodeUnlistenedDot';
import ExplicitIcon from 'icons/explicit.svg';
import { nonUnderlinedLink } from 'styles';
import { getEpisodePath } from 'utils/paths';

interface EpisodeListProps {
  episodes: Array<Episode>;
  feedId: string | number;
}

export const EpisodeList = ({ episodes, feedId }: EpisodeListProps) => {
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
      {filteredEpisodes.map(
        ({
          datePublished,
          duration,
          episodeType,
          explicit,
          feedImage,
          id,
          image,
          title,
        }) => {
          return (
            <Stack
              align="center"
              as={Link}
              className={nonUnderlinedLink}
              href={getEpisodePath({
                episodeId: id,
                feedId,
              })}
              key={id}
              kind="flexRow"
              space="xxsmall"
            >
              <EpisodeUnlistenedDot
                episodeDatePublished={datePublished}
                episodeId={id}
                feedId={feedId}
              />
              <Stack align="center" space="small" kind="flexRow">
                <Artwork
                  alt=""
                  height={80}
                  shadow="medium"
                  src={image || feedImage}
                  width={80}
                />
                <Stack
                  space="xsmall"
                  style={{ overflowY: 'hidden', padding: '4px 0' }}
                >
                  <Stack kind="flexRow" space="xxsmall" align="center">
                    {explicit > 0 ? (
                      <Icon
                        style={{ verticalAlign: 'middle' }}
                        as={ExplicitIcon}
                        size="smallMedium"
                      />
                    ) : null}{' '}
                    {episodeType === 'trailer' ? <Badge>Trailer</Badge> : null}
                    <Typography
                      as="h3"
                      className="font-bold"
                      size="headingSmaller"
                      shouldUseCapsize={false}
                      whitespace="ellipsis"
                    >
                      {title}
                    </Typography>
                  </Stack>
                  <EpisodeProgress
                    episodeDatePublished={datePublished}
                    episodeId={id}
                    episodeDuration={duration}
                  />
                </Stack>
              </Stack>
            </Stack>
          );
        },
      )}
    </Stack>
  );
};
