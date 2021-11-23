import type { PolymorphicComponent } from 'react-polymorphic-box';

import {
  iconOrientationVariant,
  iconSizeVariant,
} from 'components/atoms/Icon/icon.css';
import { vars } from 'styles';

export type IconComponent = PolymorphicComponent<
  {
    color?: keyof typeof vars.color;
    orientation?: keyof typeof iconOrientationVariant;
    size: keyof typeof iconSizeVariant;
  },
  'span'
>;
