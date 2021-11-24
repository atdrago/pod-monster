import { ImageProps } from 'next/image';
import type { PolymorphicComponent } from 'react-polymorphic-box';

import { sizeVariant } from 'components/atoms/Artwork/artwork.css';

export type ArtworkComponent = PolymorphicComponent<
  {
    edge?: 'normal' | 'overflow';
    priority?: ImageProps['priority'];
    size?: keyof typeof sizeVariant;
  },
  'img'
>;
