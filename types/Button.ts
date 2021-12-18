import type { ElementType } from 'react';
import type { PolymorphicComponentProps } from 'react-polymorphic-box';

import { buttonVariant, sizeVariant } from 'components/atoms/Button/button.css';

export type ButtonProps = PolymorphicComponentProps<
  ElementType,
  {
    size?: keyof typeof sizeVariant;
    variant?: keyof typeof buttonVariant;
  }
>;
