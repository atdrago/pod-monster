import { PolymorphicComponent } from 'react-polymorphic-box';

import {
  sizeVariant,
  textAlignVariant,
} from 'components/atoms/Typography/typography.css';

export interface ITypographyProps {
  as?: React.ElementType;
  className?: string;
  shouldUseCapsize?: boolean;
  size: keyof typeof sizeVariant;
  textAlign?: keyof typeof textAlignVariant;
  whitespace?: 'ellipsis' | 'normal' | number;
}

export type TypographyComponent = PolymorphicComponent<
  ITypographyProps,
  'span'
>;
