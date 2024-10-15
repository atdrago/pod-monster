import { useMemo } from 'react';

import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';
import { useClassNames } from 'hooks/useClassNames';

import {
  progressBar,
  progressBarContainer,
  progressBarHighlightVariant,
} from './progress.css';

interface ProgressProps {
  bottomLeftTitle?: string;
  bottomRightTitle?: string;
  isHighlighted?: boolean;
  /**
   * A number, representing the "percent complete", between 0 and 100. Will be
   * rounded to 2 decimal places.
   */
  percent?: number;
  topLeftTitle?: string;
  topRightTitle?: string;
}

export const Progress = ({
  bottomLeftTitle,
  bottomRightTitle,
  isHighlighted = false,
  percent,
  topLeftTitle,
  topRightTitle,
}: ProgressProps) => {
  const progressBarClassName = useClassNames(
    progressBar,
    progressBarHighlightVariant[`${isHighlighted}`],
  );
  const width = useMemo(
    () => (typeof percent === 'number' ? Math.round(percent * 10000) / 100 : 0),
    [percent],
  );

  return (
    <Stack space="xsmall">
      {topLeftTitle || topRightTitle ? (
        <Stack kind="flexRow" justify="spaceBetween">
          {topLeftTitle ? (
            <Typography as="p" size="legal">
              {topLeftTitle}
            </Typography>
          ) : null}
          {topRightTitle ? (
            <Typography as="p" size="legal">
              {topRightTitle}
            </Typography>
          ) : null}
        </Stack>
      ) : null}
      {typeof percent === 'number' ? (
        <div className={progressBarContainer}>
          <div
            className={progressBarClassName}
            style={{
              width: `${width}%`,
            }}
          ></div>
        </div>
      ) : null}
      {bottomLeftTitle || bottomRightTitle ? (
        <Stack kind="flexRow" justify="spaceBetween">
          {bottomLeftTitle ? (
            <Typography as="p" size="legal">
              {bottomLeftTitle}
            </Typography>
          ) : null}
          {bottomRightTitle ? (
            <Typography as="p" size="legal" textAlign="right">
              {bottomRightTitle}
            </Typography>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
};
