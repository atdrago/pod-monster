import { PolymorphicComponent } from 'react-polymorphic-box';

import {
  alignVariant,
  justifyVariant,
  kindVariant,
  maxWidthVariant,
  spaceVariant,
} from 'components/layouts/Stack/stack.css';

export type StackProps = {
  align?: keyof typeof alignVariant;
  className?: string;
  justify?: keyof typeof justifyVariant;
  kind?: keyof typeof kindVariant;
  maxWidth?: keyof typeof maxWidthVariant;
  space?: keyof typeof spaceVariant;
};

export type StackComponent = PolymorphicComponent<StackProps, 'div'>;
