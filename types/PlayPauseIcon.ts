import { iconSizeVariant } from 'components/atoms/Icon/icon.css';

export interface IPlayPauseIconProps {
  isPaused: boolean;
  size?: keyof typeof iconSizeVariant;
}
