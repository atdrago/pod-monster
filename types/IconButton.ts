import { PolymorphicComponent } from 'react-polymorphic-box';

import {
  backgroundVariant,
  sizeVariant,
} from 'components/atoms/IconButton/iconButton.css';

export type IconButtonComponent = PolymorphicComponent<
  {
    background?: keyof typeof backgroundVariant;
    label: string;
    size?: keyof typeof sizeVariant;
  },
  'button'
>;
