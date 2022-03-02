import Image from 'next/image';
import { ReactEventHandler, memo, useState } from 'react';
import { Box } from 'react-polymorphic-box';

import { Typography } from 'components/atoms/Typography';
import { useClassNames } from 'hooks/useClassNames';
import type { ArtworkComponent } from 'types';

import {
  artwork,
  artworkFallback,
  shadowContainer,
  shadowVariant,
  square,
  squareInner,
  subtitleContainer,
} from './artwork.css';

export const Artwork: ArtworkComponent = memo(
  function ArtworkComponentMemo({
    className,
    height = 512,
    isSquare = true,
    label,
    shadow = 'none',
    src,
    subtitle,
    width = 512,
    ...props
  }) {
    const [failedToLoad, setFailedToLoad] = useState(false);
    const squareClassName = useClassNames(square, className);
    const artworkClassName = useClassNames(artwork, className);
    const artworkFallbackClassName = useClassNames(artworkFallback, className);
    const shadowClassName = useClassNames(
      shadowContainer,
      shadowVariant[shadow]
    );

    const shouldShowImage = src && !failedToLoad;

    const handleError: ReactEventHandler<HTMLImageElement> = () => {
      setFailedToLoad(true);
    };

    const imageOrPlaceholder = shouldShowImage ? (
      <Box
        as={Image}
        className={artworkClassName}
        height={height}
        onError={handleError}
        src={src}
        width={width}
        {...props}
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
      <div className={shadowClassName} style={{ width: `${width}px` }}>
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
      </div>
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
  }
);
