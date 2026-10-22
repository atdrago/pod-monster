import type { sizeClasses, textAlignClasses } from './Typography';

export interface TypographyProps {
  className?: string;
  shouldTrimTextBox?: boolean;
  size: keyof typeof sizeClasses;
  textAlign?: keyof typeof textAlignClasses;
  whitespace?: 'ellipsis' | 'normal' | number;
  width?: 'auto' | 'content';
}
