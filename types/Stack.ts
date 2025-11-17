import type { ElementType } from 'react';
import type { PolymorphicComponentProps } from 'react-polymorphic-box';

export type StackProps = PolymorphicComponentProps<
  ElementType,
  {
    align?: 'center' | 'end' | 'start';
    className?: string;
    justify?: 'center' | 'spaceBetween';
    kind?: 'flex' | 'flexRow' | 'flexRowReverse' | 'grid';
    maxWidth?: 'none' | 'small';
    space?:
      | 'large'
      | 'medium'
      | 'none'
      | 'small'
      | 'xlarge'
      | 'xsmall'
      | 'xxsmall';
  }
>;
