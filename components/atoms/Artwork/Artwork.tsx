import Image from 'next/image';
import { ReactEventHandler, useState } from 'react';
import { Box } from 'react-polymorphic-box';

import { Typography } from 'components/atoms/Typography';
import { useClassNames } from 'hooks/useClassNames';
import type { ArtworkComponent } from 'types';

import {
  artwork,
  artworkFallback,
  shadowVariant,
  square,
  squareInner,
} from './artwork.css';

export const Artwork: ArtworkComponent = ({
  className,
  edge = 'normal',
  height = 512,
  isSquare = true,
  label,
  shadow = 'none',
  src,
  width = 512,
  ...props
}) => {
  const [failedToLoad, setFailedToLoad] = useState(false);
  const baseClassName = useClassNames(className, square);
  const imageClassName = useClassNames(artwork, className);
  const labelClassName = useClassNames(artworkFallback, className);

  const shouldShowImage = src && !failedToLoad;

  const handleError: ReactEventHandler<HTMLImageElement> = () => {
    setFailedToLoad(true);
  };

  return (
    <div
      className={shadowVariant[shadow]}
      style={
        edge === 'normal'
          ? { flex: '0 0 auto', height: `${height}px`, width: `${width}px` }
          : { margin: 0, padding: 0 }
      }
    >
      {isSquare ? (
        <div className={baseClassName}>
          <div className={squareInner}>
            {shouldShowImage ? (
              <Box
                as={Image}
                className={imageClassName}
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
                className={labelClassName}
              >
                {label}
              </Typography>
            )}
          </div>
        </div>
      ) : (
        <>
          {shouldShowImage ? (
            <Box
              as={Image}
              className={imageClassName}
              height={height}
              onError={handleError}
              src={src}
              width={width}
              layout="responsive"
              {...props}
            />
          ) : (
            <Typography
              as="span"
              size="headingLarge"
              className={labelClassName}
            >
              {label}
            </Typography>
          )}
        </>
      )}
    </div>
  );
};
