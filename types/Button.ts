import {
  buttonVariant,
  edgeVariant,
  sizeVariant,
} from 'components/atoms/Button/button.css';

export type ButtonProps = JSX.IntrinsicElements['button'] & {
  edge?: keyof typeof edgeVariant;
  size?: keyof typeof sizeVariant;
  variant?: keyof typeof buttonVariant;
};
