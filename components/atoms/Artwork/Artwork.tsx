import Image from 'next/image';
import { Box } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';
import type { ArtworkComponent } from 'types';

import {
  artwork,
  shadowVariant,
  sizeVariant,
  square,
  squareInner,
} from './artwork.css';

export const Artwork: ArtworkComponent = ({
  className,
  edge = 'normal',
  height = 512,
  shadow = 'none',
  size = 'full',
  src,
  width = 512,
  ...props
}) => {
  const baseClassName = useClassNames(className, square);
  const imageClassName = useClassNames(artwork, sizeVariant[size], className);

  return (
    <div
      className={shadowVariant[shadow]}
      style={
        edge === 'normal'
          ? { flex: '0 0 auto', height: `${height}px`, width: `${width}px` }
          : { margin: 0, padding: 0 }
      }
    >
      <div className={baseClassName}>
        <div className={squareInner}>
          {src ? (
            <Box
              as={Image}
              className={imageClassName}
              height={height}
              src={src}
              width={width}
              {...props}
            />
          ) : (
            <div className={imageClassName} />
          )}
        </div>
      </div>
    </div>
  );
};
