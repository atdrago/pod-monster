import { PolymorphicComponent } from 'react-polymorphic-box';

import {
  alignVariant,
  justifyVariant,
  kindVariant,
  maxWidthVariant,
  spaceVariant,
} from 'components/layouts/Stack/stack.css';

export type StackComponent = PolymorphicComponent<
  {
    align?: keyof typeof alignVariant;
    justify?: keyof typeof justifyVariant;
    kind?: keyof typeof kindVariant;
    maxWidth?: keyof typeof maxWidthVariant;
    space?: keyof typeof spaceVariant;
  },
  'div'
>;
