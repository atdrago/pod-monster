import Image from 'next/image';
import { ReactEventHandler, useState } from 'react';
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
} from './artwork.css';

export const Artwork: ArtworkComponent = ({
  className,
  height = 512,
  isSquare = true,
  label,
  shadow = 'none',
  src,
  width = 512,
  ...props
}) => {
  const [failedToLoad, setFailedToLoad] = useState(false);
  const squareClassName = useClassNames(square, className);
  const artworkClassName = useClassNames(artwork, className);
  const artworkFallbackClassName = useClassNames(artworkFallback, className);
  const shadowClassName = useClassNames(shadowContainer, shadowVariant[shadow]);

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
    </div>
  );
};
