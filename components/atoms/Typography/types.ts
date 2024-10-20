import { typographySizeVariant, typographyTextAlignVariant } from 'styles';

export interface TypographyProps {
  className?: string;
  shouldUseCapsize?: boolean;
  size: keyof typeof typographySizeVariant;
  textAlign?: keyof typeof typographyTextAlignVariant;
  whitespace?: 'ellipsis' | 'normal' | number;
}
