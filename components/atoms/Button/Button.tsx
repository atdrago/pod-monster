import type { FunctionComponent } from 'react';

import { useClassNames } from 'hooks/useClassNames';
import type { ButtonProps } from 'types';

import {
  button,
  buttonGroup,
  buttonVariant,
  edgeVariant,
  sizeVariant,
} from './button.css';

export const Button: FunctionComponent<ButtonProps> = ({
  className,
  edge = 'normal',
  size = 'medium',
  variant = 'default',
  ...rest
}) => {
  const rootClassName = useClassNames(
    button,
    buttonVariant[variant],
    sizeVariant[size],
    edgeVariant[edge],
    className
  );

  return <button className={rootClassName} type="button" {...rest} />;
};

export const ButtonGroup: FunctionComponent<JSX.IntrinsicElements['div']> = ({
  className,
  ...rest
}) => {
  const rootClassName = useClassNames(buttonGroup, className);

  return <div className={rootClassName} {...rest} />;
};
