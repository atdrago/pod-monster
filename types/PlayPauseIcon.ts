import { iconSizeVariant } from 'components/atoms/Icon/icon.css';

export interface PlayPauseIconProps {
  isLoading?: boolean;
  isPaused: boolean;
  size?: keyof typeof iconSizeVariant;
}
