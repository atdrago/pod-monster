import type { ElementType } from 'react';
import type { PolymorphicComponentProps } from 'react-polymorphic-box';

import {
  alignVariant,
  justifyVariant,
  kindVariant,
  maxWidthVariant,
  spaceVariant,
} from 'components/layouts/Stack/stack.css';

export type StackProps = PolymorphicComponentProps<
  ElementType,
  {
    align?: keyof typeof alignVariant;
    className?: string;
    justify?: keyof typeof justifyVariant;
    kind?: keyof typeof kindVariant;
    maxWidth?: keyof typeof maxWidthVariant;
    space?: keyof typeof spaceVariant;
  }
>;
