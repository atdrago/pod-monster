import { useMemo } from 'react';

import { Typography } from 'components/atoms/Typography';
import { Stack } from 'components/layouts/Stack';

const barColorClasses = {
  false: 'bg-note-border',
  true: 'bg-foreground',
} as const;

interface ProgressProps {
  bottomLeftTitle?: string;
  bottomRightTitle?: string;
  className?: string;
  isHighlighted?: boolean;
  /**
   * The completed part, as a fraction from 0 to 1. The bar width rounds it to
   * a percent with two decimal places.
   */
  percent?: number;
  topLeftTitle?: string;
  topRightTitle?: string;
}

export const Progress = ({
  bottomLeftTitle,
  bottomRightTitle,
  className,
  isHighlighted = false,
  percent,
  topLeftTitle,
  topRightTitle,
}: ProgressProps) => {
  const width = useMemo(
    () => (typeof percent === 'number' ? Math.round(percent * 10000) / 100 : 0),
    [percent],
  );

  return (
    <Stack className={className} space="xsmall">
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
        <div className="h-1 bg-background-highlight">
          <div
            className={`h-1 ${barColorClasses[`${isHighlighted}`]}`}
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
