'use client';

import { memo, useState } from 'react';
import { Box, type PolymorphicComponentProps } from 'react-polymorphic-box';

import { Typography } from 'components/atoms/Typography';

export type ArtworkComponentProps = PolymorphicComponentProps<
  'div',
  {
    alt: string;
    height?: number | `${number}` | undefined;
    isSquare?: boolean;
    label?: string;
    shadow?: boolean;
    src?: string;
    subtitle?: React.ReactNode;
    width?: number | `${number}` | undefined;
  }
>;

export const Artwork = memo<ArtworkComponentProps>(
  function ArtworkComponentMemo({
    alt,
    height = 512,
    isSquare = true,
    label,
    shadow = false,
    src,
    subtitle,
    width = 512,
  }) {
    const [failedToLoad, setFailedToLoad] = useState(false);

    const shouldShowImage = src && !failedToLoad;

    const imageOrPlaceholder = shouldShowImage ? (
      <Box
        as={'img'}
        alt={alt}
        className={`self-center object-contain h-auto max-h-full w-full`}
        height={height}
        onError={() => {
          setFailedToLoad(true);
        }}
        src={src}
        width={width}
      />
    ) : (
      <Typography
        as="span"
        size="headingLarge"
        className={`
          self-center object-contain items-center justify-center
          h-auto max-h-full w-full p-4
          flex grow-0 shrink-0
          whitespace-nowrap
        `}
      >
        {label}
      </Typography>
    );

    return (
      <Box
        className={`
          max-w-full leading-0 grow-0 shrink-0 relative
          ${shadow ? 'shadow-lg/35' : ''}
        `}
        style={{ width: `${width}px` }}
      >
        {isSquare ? (
          <div
            style={{ gridArea: '1 / 1' }}
            className={`
              dark:bg-zinc-900/70
              grid overflow-hidden
              h-0 w-full pt-[100%] relative
            `}
          >
            <div
              className={`
                items-center flex justify-center mt-[-100%] text-center w-full
              `}
            >
              {imageOrPlaceholder}
            </div>
          </div>
        ) : (
          imageOrPlaceholder
        )}
        {subtitle && (
          <div
            aria-label="Subtitles"
            aria-live="polite"
            className={`
              bg-zinc-300/80 dark:bg-zinc-900/80
              absolute bottom-0 right-0 left-0
              m-4 p-4
            `}
            role="log"
          >
            <Typography as="span" size="paragraph">
              {subtitle}
            </Typography>
          </div>
        )}
      </Box>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.height === nextProps.height &&
      prevProps.isSquare === nextProps.isSquare &&
      prevProps.label === nextProps.label &&
      prevProps.shadow === nextProps.shadow &&
      prevProps.src === nextProps.src &&
      prevProps.subtitle === nextProps.subtitle &&
      prevProps.width === nextProps.width
    );
  },
);
