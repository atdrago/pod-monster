import { ImageProps } from 'next/image';
import type { PolymorphicComponent } from 'react-polymorphic-box';

import { shadowVariant } from 'components/atoms/Artwork/artwork.css';

export type ArtworkComponent = PolymorphicComponent<
  {
    alt: string;
    edge?: 'normal' | 'overflow';
    isSquare?: boolean;
    label?: string;
    priority?: ImageProps['priority'];
    shadow?: keyof typeof shadowVariant;
  },
  'img'
>;
