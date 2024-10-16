'use client';

import { ReactEventHandler, memo, useState } from 'react';
import { Box, type PolymorphicComponentProps } from 'react-polymorphic-box';

import type { ImageProps } from 'next/image';
import { Typography } from 'components/atoms/Typography';
import { useClassNames } from 'hooks/useClassNames';

import {
  artwork,
  artworkFallback,
  shadowContainer,
  shadowVariant,
  square,
  squareInner,
  subtitleContainer,
} from './artwork.css';

type ArtworkComponentProps = PolymorphicComponentProps<
  'div',
  {
    alt: string;
    height?: ImageProps['height'];
    isSquare?: boolean;
    label?: string;
    priority?: ImageProps['priority'];
    shadow?: keyof typeof shadowVariant;
    src?: string;
    subtitle?: React.ReactNode;
    width?: ImageProps['width'];
  }
>;

export const Artwork = memo<ArtworkComponentProps>(
  function ArtworkComponentMemo({
    alt,
    className,
    height = 512,
    isSquare = true,
    label,
    shadow = 'none',
    src,
    subtitle,
    width = 512,
  }) {
    const [failedToLoad, setFailedToLoad] = useState(false);
    const squareClassName = useClassNames(square, className);
    const artworkClassName = useClassNames(artwork, className);
    const artworkFallbackClassName = useClassNames(artworkFallback, className);
    const shadowClassName = useClassNames(
      shadowContainer,
      shadowVariant[shadow],
    );

    const shouldShowImage = src && !failedToLoad;

    const handleError: ReactEventHandler<HTMLImageElement> = () => {
      setFailedToLoad(true);
    };

    const imageOrPlaceholder = shouldShowImage ? (
      <Box
        as={'img'}
        alt={alt}
        className={artworkClassName}
        height={height}
        onError={handleError}
        src={src}
        width={width}
      />
    ) : (
      <Typography
        as="span"
        size="headingLarge"
        className={artworkFallbackClassName}
      >
        {label}
      </Typography>
    );

    return (
      <Box className={shadowClassName} style={{ width: `${width}px` }}>
        {isSquare ? (
          <div className={squareClassName}>
            <div className={squareInner}>{imageOrPlaceholder}</div>
          </div>
        ) : (
          imageOrPlaceholder
        )}
        {subtitle && (
          <div
            aria-label="Subtitles"
            aria-live="polite"
            className={subtitleContainer}
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
