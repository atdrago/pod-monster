import type { PolymorphicComponent } from 'react-polymorphic-box';

import { sizeVariant } from 'components/atoms/Artwork/artwork.css';

export type ArtworkComponent = PolymorphicComponent<
  {
    edge?: 'normal' | 'overflow';
    size?: keyof typeof sizeVariant;
  },
  'img'
>;
