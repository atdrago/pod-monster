import type { PolymorphicComponentProps } from 'react-polymorphic-box';

import {
  iconOrientationVariant,
  iconSizeVariant,
} from 'components/atoms/Icon/icon.css';
import { vars } from 'styles';

export type IconComponentProps = PolymorphicComponentProps<
  'span',
  {
    color?: keyof typeof vars.color;
    orientation?: keyof typeof iconOrientationVariant;
    size: keyof typeof iconSizeVariant;
  }
>;
