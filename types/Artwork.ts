import { ImageProps } from 'next/image';
import type { PolymorphicComponentProps } from 'react-polymorphic-box';

import { shadowVariant } from 'components/atoms/Artwork/artwork.css';

export type ArtworkComponentProps = PolymorphicComponentProps<
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
