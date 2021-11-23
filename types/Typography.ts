import { PolymorphicComponent } from 'react-polymorphic-box';

import {
  sizeVariant,
  textAlignVariant,
} from 'components/atoms/Typography/typography.css';

export type TypographyComponent = PolymorphicComponent<
  {
    as: React.ElementType;
    shouldUseCapsize?: boolean;
    size: keyof typeof sizeVariant;
    textAlign?: keyof typeof textAlignVariant;
    whitespace?: 'ellipsis' | 'normal';
  },
  'span'
>;
