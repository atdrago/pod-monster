import { ImageProps } from 'next/image';
import type { PolymorphicComponent } from 'react-polymorphic-box';

import {
  shadowVariant,
  sizeVariant,
} from 'components/atoms/Artwork/artwork.css';

export type ArtworkComponent = PolymorphicComponent<
  {
    edge?: 'normal' | 'overflow';
    priority?: ImageProps['priority'];
    shadow?: keyof typeof shadowVariant;
    size?: keyof typeof sizeVariant;
  },
  'img'
>;
