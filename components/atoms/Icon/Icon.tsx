import { Box, PolymorphicComponentProps } from 'react-polymorphic-box';

import { vars } from 'styles';

export type IconSize =
  | 'xxsmall'
  | 'xsmall'
  | 'small'
  | 'smallMedium'
  | 'medium'
  | 'large';

type IconComponentProps = PolymorphicComponentProps<
  React.ElementType,
  {
    color?: keyof typeof vars.color;
    orientation?: 'default' | 'reverse' | 'rotate90' | 'spinning';
    size: IconSize;
  }
>;

const sizeClasses = {
  large: 'text-[36px] min-h-[36px] min-w-[36px]',
  medium: 'text-[22px] min-h-[22px] min-w-[22px]',
  small: 'text-[16px] min-h-[16px] min-w-[16px]',
  smallMedium: 'text-[20px] min-h-[20px] min-w-[20px]',
  xsmall: 'text-[12px] min-h-[12px] min-w-[12px]',
  xxsmall: 'text-[8px] min-h-[8px] min-w-[8px]',
} as const;

const orientationClasses = {
  default: '',
  reverse: 'scale-x-[-1]',
  rotate90: 'rotate-90',
  spinning: 'animate-[spin_1s_linear_infinite] origin-center',
} as const;

export const Icon = ({
  className,
  color = 'foreground',
  orientation = 'default',
  size,
  ...spanProps
}: IconComponentProps) => {
  return (
    <Box
      as="span"
      className={`inline-flex items-center leading-none ${sizeClasses[size]} ${orientationClasses[orientation]} ${className ?? ''}`}
      style={{ color: vars.color[color] }}
      {...spanProps}
    />
  );
};
