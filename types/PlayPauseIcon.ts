import { iconSizeVariant } from 'components/atoms/Icon/icon.css';

export interface IPlayPauseIconProps {
  isLoading?: boolean;
  isPaused: boolean;
  size?: keyof typeof iconSizeVariant;
}
