import type { ElementType } from 'react';
import type { PolymorphicComponentProps } from 'react-polymorphic-box';

import {
  buttonVariant,
  edgeVariant,
  sizeVariant,
} from 'components/atoms/Button/button.css';

export type ButtonProps = PolymorphicComponentProps<
  ElementType,
  {
    edge?: keyof typeof edgeVariant;
    size?: keyof typeof sizeVariant;
    variant?: keyof typeof buttonVariant;
  }
>;
