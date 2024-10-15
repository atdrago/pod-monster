import { PolymorphicComponentProps } from 'react-polymorphic-box';

import {
  sizeVariant,
  textAlignVariant,
} from 'components/atoms/Typography/typography.css';

export interface TypographyProps {
  className?: string;
  shouldUseCapsize?: boolean;
  size: keyof typeof sizeVariant;
  textAlign?: keyof typeof textAlignVariant;
  whitespace?: 'ellipsis' | 'normal' | number;
}

export type TypographyComponentProps = PolymorphicComponentProps<
  React.ElementType<any>,
  TypographyProps
>;
